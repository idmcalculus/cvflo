import puppeteer, { Browser } from 'puppeteer';
import { CVData, SectionVisibility } from '../types/cv.ts';
import { HtmlGenerator } from '../utils/htmlGenerator.ts';
import { createAppLogger } from '../utils/logger.ts';
import { BadRequestError, InternalServerError } from '../utils/errors.ts';

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
   * Generate a CV PDF from data using Puppeteer
   * @param data - CV data
   * @param visibility - Visibility settings for sections
   * @param templateName - Template name to use (default: 'classic')
   * @returns PDF buffer as Uint8Array
   */
  public async generatePdf(data: CVData | null, visibility: SectionVisibility | null, templateName = 'classic'): Promise<Uint8Array> {
    if (!data || !visibility) {
      throw new BadRequestError('CV data and visibility settings are required');
    }

    let browser: Browser | null = null;
    try {
      // Generate HTML from CV data using template
      const html = await this.htmlGenerator.generateHTML(data, visibility, templateName);

      // Launch a headless browser with recommended security settings
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      // Create a new page
      const page = await browser.newPage();

      // Set the page content to our HTML
      await page.setContent(html, {
        waitUntil: 'networkidle0', // Wait until all resources are loaded
      });

      // Wait for fonts to load properly
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

      // Generate a PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.125in',
          right: '0.125in',
          bottom: '0.125in',
          left: '0.125in',
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true,
      });

      return pdfBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error generating PDF', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
      // Throw a specific AppError for better handling downstream
      throw new InternalServerError(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      if (browser) {
        await browser.close();
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
  public async generateHTML(data: CVData, visibility: SectionVisibility, templateName = 'classic'): Promise<string> {
    return await this.htmlGenerator.generateHTML(data, visibility, templateName);
  }

  /**
   * Generate PDF from pre-rendered HTML content
   * @param htmlContent - Pre-rendered HTML content
   * @param styles - CSS styles to include
   * @returns PDF buffer as Uint8Array
   */
  public async generatePdfFromHtml(htmlContent: string, styles: string = ''): Promise<Uint8Array> {
    let browser: Browser | null = null;
    try {
      // Create a complete HTML document with styles
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CV</title>
          <style>
            ${styles}
            /* Additional PDF-specific styles */
            body { margin: 0; padding: 0; }
            .quill-wrapper { background: transparent !important; }
            .shadow-lg, .shadow-md, .shadow-sm { box-shadow: none !important; }
            .rounded-lg, .rounded-xl { border-radius: 8px !important; }
            /* Ensure proper page breaks */
            @media print {
              .page-break { page-break-before: always; }
              .no-break { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      // Launch a headless browser with recommended security settings
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      // Create a new page
      const page = await browser.newPage();

      // Set the page content to our HTML
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0', // Wait until all resources are loaded
      });

      // Wait for fonts to load properly
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

      // Generate a PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.125in',
          right: '0.125in',
          bottom: '0.125in',
          left: '0.125in',
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true,
      });

      return pdfBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error generating PDF from HTML', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
      // Throw a specific AppError for better handling downstream
      throw new InternalServerError(`Failed to generate PDF from HTML: ${errorMessage}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
