import puppeteer, { Browser, Page } from 'puppeteer';
import { createAppLogger } from '../utils/logger.ts';

/**
 * Puppeteer Browser Pool Service
 * Manages a pool of browser instances to reduce PDF generation latency
 * from ~5s to ~1-2s by reusing browser instances
 */
export class PuppeteerPool {
  private browsers: Browser[] = [];
  private availableBrowsers: Browser[] = [];
  private busyBrowsers: Set<Browser> = new Set();
  private logger = createAppLogger();
  private readonly maxPoolSize: number;
  private readonly minPoolSize: number;
  private isInitialized = false;
  private initializationPromise?: Promise<void>;

  constructor(minPoolSize = 2, maxPoolSize = 5) {
    this.minPoolSize = minPoolSize;
    this.maxPoolSize = maxPoolSize;
  }

  /**
   * Initialize the browser pool
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized || this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    this.logger.info(`Initializing Puppeteer pool with min=${this.minPoolSize}, max=${this.maxPoolSize}`);
    
    try {
      // Create minimum number of browsers
      for (let i = 0; i < this.minPoolSize; i++) {
        const browser = await this.createBrowser();
        this.browsers.push(browser);
        this.availableBrowsers.push(browser);
      }
      
      this.isInitialized = true;
      this.logger.info(`Puppeteer pool initialized with ${this.browsers.length} browsers`);
    } catch (error) {
      this.logger.error('Failed to initialize Puppeteer pool', { error });
      throw error;
    }
  }

  /**
   * Create a new browser instance with optimized settings
   */
  private async createBrowser(): Promise<Browser> {
    // Determine platform-specific arguments
    const isMacOS = process.platform === 'darwin';
    const isProduction = process.env.NODE_ENV === 'production';
    
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--no-first-run',
      '--no-default-browser-check',
      '--memory-pressure-off',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
    ];

    // Add macOS-specific arguments
    if (isMacOS) {
      baseArgs.push(
        '--disable-background-media-suspend',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--disable-crash-reporter',
        '--disable-crashpad'
      );
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: baseArgs,
      // Increase timeout for browser launch
      timeout: 30000,
      // Don't download Chromium if it exists
      ...(isProduction && { 
        executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' 
      }),
    });

    // Monitor browser disconnection
    browser.on('disconnected', () => {
      this.handleBrowserDisconnection(browser);
    });

    return browser;
  }

  /**
   * Handle browser disconnection
   */
  private handleBrowserDisconnection(browser: Browser): void {
    this.logger.warn('Browser disconnected, removing from pool');
    
    // Remove from all collections
    this.browsers = this.browsers.filter(b => b !== browser);
    this.availableBrowsers = this.availableBrowsers.filter(b => b !== browser);
    this.busyBrowsers.delete(browser);

    // Create replacement browser if below minimum
    if (this.browsers.length < this.minPoolSize) {
      this.createBrowser()
        .then(newBrowser => {
          this.browsers.push(newBrowser);
          this.availableBrowsers.push(newBrowser);
          this.logger.info('Replacement browser created');
        })
        .catch(error => {
          this.logger.error('Failed to create replacement browser', { error });
        });
    }
  }

  /**
   * Get an available browser from the pool
   */
  public async getBrowser(): Promise<Browser> {
    await this.initialize();

    // Try to get an available browser
    if (this.availableBrowsers.length > 0) {
      const browser = this.availableBrowsers.shift()!;
      this.busyBrowsers.add(browser);
      this.logger.debug('Reusing browser from pool', { 
        available: this.availableBrowsers.length,
        busy: this.busyBrowsers.size 
      });
      return browser;
    }

    // If no available browsers and we haven't reached max capacity, create new one
    if (this.browsers.length < this.maxPoolSize) {
      const browser = await this.createBrowser();
      this.browsers.push(browser);
      this.busyBrowsers.add(browser);
      this.logger.info('Created new browser for pool', { 
        total: this.browsers.length,
        busy: this.busyBrowsers.size 
      });
      return browser;
    }

    // Wait for a browser to become available
    this.logger.warn('Pool at capacity, waiting for available browser');
    return new Promise((resolve) => {
      const checkForAvailable = () => {
        if (this.availableBrowsers.length > 0) {
          const browser = this.availableBrowsers.shift()!;
          this.busyBrowsers.add(browser);
          resolve(browser);
        } else {
          setTimeout(checkForAvailable, 100);
        }
      };
      checkForAvailable();
    });
  }

  /**
   * Return a browser to the pool
   */
  public async returnBrowser(browser: Browser): Promise<void> {
    if (!this.busyBrowsers.has(browser)) {
      this.logger.warn('Attempted to return browser not in busy set');
      return;
    }

    this.busyBrowsers.delete(browser);

    // Check if browser is still connected
    if (browser.isConnected()) {
      // Clean up any open pages (except the default one)
      try {
        const pages = await browser.pages();
        // Close all pages except the first one (default)
        for (let i = 1; i < pages.length; i++) {
          await pages[i].close();
        }
        
        this.availableBrowsers.push(browser);
        this.logger.debug('Browser returned to pool', { 
          available: this.availableBrowsers.length,
          busy: this.busyBrowsers.size 
        });
      } catch (error) {
        this.logger.error('Error cleaning up browser pages', { error });
        // If cleanup fails, remove the browser from pool
        this.browsers = this.browsers.filter(b => b !== browser);
        browser.close().catch(() => {}); // Close without throwing
      }
    } else {
      // Browser is disconnected, remove from pool
      this.browsers = this.browsers.filter(b => b !== browser);
      this.logger.warn('Returned browser was disconnected, removed from pool');
    }
  }

  /**
   * Create a new page with optimized settings
   */
  public async createOptimizedPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    
    // Optimize page for PDF generation
    await page.setJavaScriptEnabled(true);
    await page.setRequestInterception(false); // Disable for better performance
    
    return page;
  }

  /**
   * Get pool statistics
   */
  public getStats(): { total: number; available: number; busy: number } {
    return {
      total: this.browsers.length,
      available: this.availableBrowsers.length,
      busy: this.busyBrowsers.size,
    };
  }

  /**
   * Close all browsers and clean up the pool
   */
  public async destroy(): Promise<void> {
    this.logger.info('Destroying Puppeteer pool');
    
    const closePromises = this.browsers.map(browser => 
      browser.close().catch(error => 
        this.logger.error('Error closing browser', { error })
      )
    );
    
    await Promise.allSettled(closePromises);
    
    this.browsers = [];
    this.availableBrowsers = [];
    this.busyBrowsers.clear();
    this.isInitialized = false;
    this.initializationPromise = undefined;
    
    this.logger.info('Puppeteer pool destroyed');
  }

  /**
   * Warm up the pool by pre-creating browsers
   */
  public async warmUp(): Promise<void> {
    await this.initialize();
    this.logger.info('Puppeteer pool warmed up');
  }
}

// Singleton instance
let poolInstance: PuppeteerPool | null = null;

/**
 * Get the singleton Puppeteer pool instance
 */
export function getPuppeteerPool(): PuppeteerPool {
  if (!poolInstance) {
    poolInstance = new PuppeteerPool();
  }
  return poolInstance;
}

/**
 * Cleanup function for graceful shutdown
 */
export async function shutdownPuppeteerPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.destroy();
    poolInstance = null;
  }
}