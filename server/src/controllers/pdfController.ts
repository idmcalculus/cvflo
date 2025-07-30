import type { Request, Response, NextFunction } from 'express';
import { PdfService } from '../services/pdfService.ts';
import { CVData, SectionVisibility } from '../types/cv.ts';
import { createAppLogger } from '../utils/logger.ts';
import { AppError, BadRequestError, InternalServerError } from '../utils/errors.ts';
import { getPuppeteerPool } from '../services/puppeteerPool.ts';

/**
 * PDF Controller class following Single Responsibility Principle
 * Handles HTTP requests related to PDF generation
 */
export class PdfController {
  private pdfService: PdfService;

  constructor(pdfService: PdfService) {
    this.pdfService = pdfService;
    this.generatePdf = this.generatePdf.bind(this);
    this.getTemplates = this.getTemplates.bind(this);
    this.generatePreview = this.generatePreview.bind(this);
    this.generatePdfFromHtml = this.generatePdfFromHtml.bind(this);
  }

  /**
   * Generate PDF from CV data
   */
  public async generatePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cvData, visibility, templateName = 'classic-0' } = req.body;
      
      if (!cvData || !visibility) {
        throw new BadRequestError('CV data and visibility settings are required');
      }
      
      // Generate PDF using the service with selected template
      const pdfBuffer = await this.pdfService.generatePdf(cvData as CVData, visibility as SectionVisibility, templateName);
      
      // Get suggested filename
      const filename = this.pdfService.getSuggestedFilename(cvData as CVData);
      
      // Send PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
      
      createAppLogger().info('PDF generated successfully', { 
        user: req.ip, 
        filename,
        contentLength: pdfBuffer.length
      });
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      } else {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred during PDF generation';
        return next(new InternalServerError(message)); 
      }
    }
  }

  /**
   * Get available templates
   */
  public async getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await this.pdfService.getAvailableTemplates();
      res.json({ templates });
      
      createAppLogger().info('Templates list requested', { 
        user: req.ip, 
        templateCount: templates.length
      });
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      } else {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred while fetching templates';
        return next(new InternalServerError(message)); 
      }
    }
  }

  /**
   * Generate HTML preview from CV data
   */
  public async generatePreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cvData, visibility, templateName = 'classic-0' } = req.body;
      
      if (!cvData || !visibility) {
        throw new BadRequestError('CV data and visibility settings are required');
      }
      
      // Generate HTML using the HTML generator with selected template
      const html = await this.pdfService.generateHTML(cvData as CVData, visibility as SectionVisibility, templateName);
      
      // Return HTML for preview
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      
      createAppLogger().info('Preview generated successfully', { 
        user: req.ip, 
        templateName
      });
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      } else {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred during preview generation';
        return next(new InternalServerError(message)); 
      }
    }
  }

  /**
   * Generate PDF from pre-rendered HTML content (unified approach for all templates)
   */
  public async generatePdfFromHtml(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { htmlContent, styles, cvData, templateName } = req.body;

      console.log('🔥 generatePdfFromHtml called!');
      console.log('- HTML Content Length:', htmlContent?.length || 0);
      console.log('- Styles Length:', styles?.length || 0);
      console.log('- Template Name:', templateName);
      console.log('- Has CV Data:', !!cvData);

      if (!htmlContent) {
        throw new BadRequestError('HTML content is required');
      }

      // Generate PDF using the enhanced HTML-to-PDF service with template name
      const pdfBuffer = await this.pdfService.generatePdfFromHtml(htmlContent, styles || '', templateName || 'classic-0');

      // Get suggested filename from CV data if available
      const filename = cvData ? this.pdfService.getSuggestedFilename(cvData as CVData) : 'CV_Resume.pdf';

      // Send PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);

      createAppLogger().info('PDF generated from HTML successfully', {
        user: req.ip,
        filename,
        contentLength: pdfBuffer.length
      });
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      } else {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred during HTML PDF generation';
        return next(new InternalServerError(message));
      }
    }
  }

  /**
   * Get system health including Puppeteer pool status
   */
  public async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pool = getPuppeteerPool();
      const poolStats = pool.getStats();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        puppeteerPool: {
          ...poolStats,
          healthy: poolStats.total > 0,
        },
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };

      res.status(200).json(health);

      createAppLogger().info('Health check requested', {
        user: req.ip,
        poolStats,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      } else {
        const message = error instanceof Error ? error.message : 'Health check failed';
        return next(new InternalServerError(message));
      }
    }
  }
}
