import { Browser, Page } from 'puppeteer';
import { CVData, SectionVisibility } from '../types/cv.ts';
import { HtmlGenerator } from '../utils/htmlGenerator.ts';
import { createAppLogger } from '../utils/logger.ts';
import { BadRequestError, InternalServerError } from '../utils/errors.ts';
import { getTemplatePDFSettings, getTemplateConfig } from '../config/templateConfig.ts';
import { getPuppeteerPool } from './puppeteerPool.ts';

/**
 * PDF Service class following Single Responsibility Principle
 * Handles all PDF generation functionalities
 */
export class PdfService {
  private htmlGenerator: HtmlGenerator;
  private logger: ReturnType<typeof createAppLogger>;

  constructor() {
    this.htmlGenerator = new HtmlGenerator();
    this.logger = createAppLogger();
  }

  /**
   * Generate a CV PDF from data using Puppeteer with template-specific settings
   * @param data - CV data
   * @param visibility - Visibility settings for sections
   * @param templateName - Template name to use (default: 'classic-0')
   * @returns PDF buffer as Uint8Array
   */
  public async generatePdf(data: CVData | null, visibility: SectionVisibility | null, templateName = 'classic-0'): Promise<Uint8Array> {
    if (!data || !visibility) {
      throw new BadRequestError('CV data and visibility settings are required');
    }

    const pool = getPuppeteerPool();
    let browser: Browser | null = null;
    let page: Page | null = null;
    
    try {
      // Get template-specific configuration
      const templateConfig = getTemplateConfig(templateName);
      const pdfSettings = templateConfig.pdfSettings;
      
      this.logger.info(`Generating PDF with template-specific settings for ${templateName}`, {
        scale: pdfSettings.scale,
        viewport: pdfSettings.viewport,
        margin: pdfSettings.margin,
        waitTime: pdfSettings.waitTime,
        poolStats: pool.getStats()
      });

      // Generate HTML from CV data using template
      const html = await this.htmlGenerator.generateHTML(data, visibility, templateName);

      // Get browser from pool instead of launching new instance
      browser = await pool.getBrowser();
      
      // Create an optimized page
      page = await pool.createOptimizedPage(browser);

      // Set viewport based on template configuration
      await page.setViewport({
        width: pdfSettings.viewport.width,
        height: pdfSettings.viewport.height,
        deviceScaleFactor: 1,
      });

      // Set the page content to our HTML
      await page.setContent(html, {
        waitUntil: 'networkidle0', // Wait until all resources are loaded
      });

      // Wait for fonts to load and content to render properly (template-specific timing)
      await page.evaluate((waitTime) => new Promise(resolve => setTimeout(resolve, waitTime)), pdfSettings.waitTime);
      
      // Wait for any images to load
      await page.evaluate(() => {
        return Promise.all(Array.from(document.images, img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        }));
      });

      // Generate a PDF with optimized settings for full page utilization
      const pdfBuffer = await page.pdf({
        format: pdfSettings.format,
        printBackground: pdfSettings.printBackground,
        margin: pdfSettings.margin,
        displayHeaderFooter: false,
        preferCSSPageSize: true, // Allow all templates to use CSS @page rules for proper spacing
        scale: pdfSettings.scale,
        // Use explicit dimensions for precise control
        width: `${pdfSettings.viewport.width}px`,
        height: `${pdfSettings.viewport.height}px`,
        // Ensure consistent rendering
        tagged: false,
        outline: false,
      });

      return pdfBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error generating PDF', { 
        error: errorMessage, 
        stack: error instanceof Error ? error.stack : undefined,
        templateName 
      });
      // Throw a specific AppError for better handling downstream
      throw new InternalServerError(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      // Close the page and return browser to pool
      if (page) {
        await page.close().catch(err => this.logger.warn('Error closing page', { err }));
      }
      if (browser) {
        await pool.returnBrowser(browser);
      }
    }
  }

  /**
   * Get suggested filename for the generated PDF
   * @param data - CV data
   * @returns Suggested filename
   */
  public getSuggestedFilename(data: CVData | null): string {
    if (!data?.personalInfo) {
      return 'resume.pdf';
    }
    const { firstName, lastName } = data.personalInfo;
    const nameParts: string[] = [];
    if (firstName && firstName.trim()) {
      nameParts.push(firstName.trim());
    }
    if (lastName && lastName.trim()) {
      nameParts.push(lastName.trim());
    }

    if (nameParts.length === 0) {
      return 'resume.pdf';
    }

    return `${nameParts.join('_')}_Resume.pdf`;
  }

  /**
   * Get list of available templates
   * @returns Array of template names
   */
  public async getAvailableTemplates(): Promise<string[]> {
    return await this.htmlGenerator.getAvailableTemplates();
  }

  /**
   * Generate HTML from CV data (for preview)
   * @param data - CV data
   * @param visibility - Visibility settings for sections
   * @param templateName - Template name to use (default: 'classic')
   * @returns HTML string
   */
  public async generateHTML(data: CVData, visibility: SectionVisibility, templateName = 'classic-0'): Promise<string> {
    return await this.htmlGenerator.generateHTML(data, visibility, templateName);
  }

  /**
   * Generate PDF from pre-rendered HTML content (unified approach for all templates)
   * @param htmlContent - Pre-rendered HTML content
   * @param styles - CSS styles to include
   * @param templateName - Template name for configuration (default: 'classic-0')
   * @returns PDF buffer as Uint8Array
   */
  public async generatePdfFromHtml(htmlContent: string, styles: string = '', templateName = 'classic-0'): Promise<Uint8Array> {
    const pool = getPuppeteerPool();
    let browser: Browser | null = null;
    let page: Page | null = null;
    
    try {
      // Get template-specific configuration
      const templateConfig = getTemplateConfig(templateName);
      const pdfSettings = templateConfig.pdfSettings;
      
      this.logger.info(`Generating PDF from HTML with template-specific settings for ${templateName}`, {
        scale: pdfSettings.scale,
        viewport: pdfSettings.viewport,
        margin: pdfSettings.margin,
        waitTime: pdfSettings.waitTime,
        htmlLength: htmlContent?.length || 0,
        stylesLength: styles?.length || 0,
        poolStats: pool.getStats()
      });
      // Create a complete HTML document with minimal interference to preserve preview styling
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CV</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            /* Include extracted styles from preview */
            ${styles}
            
            /* Essential PDF-specific overrides for full page width utilization */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            
            /* Full page layout - remove all margins and set proper dimensions */
            html, body { 
              margin: 0 !important; 
              padding: 0 !important; 
              width: 100% !important;
              height: 100% !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            }
            
            /* Remove max-width constraints and centering */
            .container-resume,
            .cv-content,
            [class*="max-w-"],
            [class*="container"],
            .mx-auto {
              max-width: none !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 1rem !important;
            }
            
            /* Optimize padding for PDF - maintain readability but reduce waste */
            body.py-8 { padding: 0.5rem !important; }
            .p-8 { padding: 1rem !important; }
            .p-10 { padding: 1rem !important; }
            
            /* Remove visual elements that create white space */
            .shadow-lg, .shadow-md, .shadow-xl, .shadow { box-shadow: none !important; }
            .rounded-lg, .rounded { border-radius: 0 !important; }
            
            /* Maintain grid layouts but ensure they use full width */
            .grid { display: grid !important; width: 100% !important; }
            
            /* Hide interactive elements */
            button, [role="button"] { display: none !important; }
            
            /* Page break control */
            .page-break { page-break-before: always !important; }
            .no-break { page-break-inside: avoid !important; }
            
            /* Enhanced page break handling for academic template */
            .section-item {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              margin-bottom: 0.75rem !important;
            }
            
            .section-title {
              page-break-after: avoid !important;
              margin-top: 0.6rem !important;
            }
            
            .employment-section,
            .projects-section,
            .education-section {
              break-inside: auto;
            }
            
            section {
              orphans: 3;
              widows: 3;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      // Get browser from pool instead of launching new instance
      browser = await pool.getBrowser();
      
      // Create an optimized page
      page = await pool.createOptimizedPage(browser);

      // Set viewport based on template configuration
      await page.setViewport({
        width: pdfSettings.viewport.width,
        height: pdfSettings.viewport.height,
        deviceScaleFactor: 1,
      });

      // Set the page content to our HTML
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0', // Wait until all resources are loaded
      });

      // Wait for fonts to load and content to render properly (template-specific timing)
      await page.evaluate((waitTime) => new Promise(resolve => setTimeout(resolve, waitTime)), pdfSettings.waitTime);
      
      // Set body background to match the outermost container for seamless appearance
      await page.evaluate(() => {
        const outerContainer = document.body.firstElementChild as HTMLElement;
        if (outerContainer) {
          const computedStyle = getComputedStyle(outerContainer);
          const backgroundColor = computedStyle.backgroundColor;
          
          // Set body background if container has one
          if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
            document.body.style.backgroundColor = backgroundColor;
          }
        }
      });
      
      // Wait for any images to load
      await page.evaluate(() => {
        return Promise.all(Array.from(document.images, img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        }));
      });

      // Generate a PDF with optimized settings for full page utilization
      const pdfBuffer = await page.pdf({
        format: pdfSettings.format,
        printBackground: pdfSettings.printBackground,
        margin: pdfSettings.margin,
        displayHeaderFooter: false,
        preferCSSPageSize: true, // Allow all templates to use CSS @page rules for proper spacing
        scale: pdfSettings.scale,
        // Use explicit dimensions for precise control
        width: `${pdfSettings.viewport.width}px`,
        height: `${pdfSettings.viewport.height}px`,
        // Ensure consistent rendering
        tagged: false,
        outline: false,
      });

      return pdfBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error('Error generating PDF from HTML', { 
        error: errorMessage, 
        stack: errorStack,
        templateName,
        htmlLength: htmlContent?.length || 0,
        poolStats: pool.getStats()
      });
      
      // Categorize errors for better user experience
      let userFriendlyMessage = 'Failed to generate PDF from HTML';
      
      if (errorMessage.includes('Failed to launch the browser process') || 
          errorMessage.includes('browser process')) {
        userFriendlyMessage = 'PDF generation service is temporarily unavailable. Please try again in a few moments.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        userFriendlyMessage = 'PDF generation is taking longer than expected. Please try again with a simpler CV layout.';
      } else if (errorMessage.includes('Navigation') || errorMessage.includes('net::ERR')) {
        userFriendlyMessage = 'There was an issue processing your CV content. Please check your data and try again.';
      } else if (errorMessage.includes('memory') || errorMessage.includes('Memory')) {
        userFriendlyMessage = 'Your CV is too large to process. Please try reducing the content or using a simpler template.';
      } else if (errorMessage.includes('Protocol error') || errorMessage.includes('Session closed')) {
        userFriendlyMessage = 'PDF generation service encountered an issue. Please try again.';
      } else {
        // For unknown errors, provide a generic message but log the full error
        userFriendlyMessage = 'We encountered a technical issue while generating your PDF. Please try again later.';
      }
      
      // Create a structured error response
      const structuredError = {
        success: false,
        message: userFriendlyMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          debug: {
            originalError: errorMessage,
            templateName,
            htmlLength: htmlContent?.length || 0
          }
        })
      };
      
      throw new InternalServerError(JSON.stringify(structuredError));
    } finally {
      // Close the page and return browser to pool
      if (page) {
        await page.close().catch(err => this.logger.warn('Error closing page', { err }));
      }
      if (browser) {
        await pool.returnBrowser(browser);
      }
    }
  }
}
