import { Router } from 'express';
import type { PdfController } from '../controllers/pdfController.ts';
import { validatePdfRequest } from '../middleware/validators.ts';
import { 
  requireSupabaseAuth, 
  optionalSupabaseAuth, 
  createPDFRateLimit,
  trackPDFGeneration 
} from '../middleware/supabaseAuth.ts';

const createPdfRouter = (pdfController: PdfController) => {
  const router = Router();

  // Create rate limiters for different operations
  const pdfGenerationRateLimit = createPDFRateLimit(15 * 60 * 1000, 10); // 10 PDFs per 15 minutes per user
  const previewRateLimit = createPDFRateLimit(5 * 60 * 1000, 100); // 100 previews per 5 minutes per user

  /**
   * @route POST /generate-pdf
   * @desc Generate PDF from CV data
   * @access Private - Requires Supabase authentication
   */
  router.post('/generate-pdf', 
    requireSupabaseAuth,
    pdfGenerationRateLimit,
    trackPDFGeneration,
    validatePdfRequest, 
    pdfController.generatePdf
  );

  /**
   * @route GET /templates
   * @desc Get available CV templates
   * @access Public - No authentication required for template list
   */
  router.get('/templates', pdfController.getTemplates);

  /**
   * @route POST /generate-preview
   * @desc Generate HTML preview from CV data
   * @access Private - Requires Supabase authentication
   */
  router.post('/generate-preview', 
    requireSupabaseAuth,
    previewRateLimit,
    validatePdfRequest, 
    pdfController.generatePreview
  );

  /**
   * @route POST /generate-pdf-from-html
   * @desc Generate PDF from pre-rendered HTML content
   * @access Private - Requires Supabase authentication
   */
  router.post('/generate-pdf-from-html', 
    requireSupabaseAuth,
    pdfGenerationRateLimit,
    trackPDFGeneration,
    pdfController.generatePdfFromHtml
  );

  /**
   * @route GET /health
   * @desc Get system health including Puppeteer pool status
   * @access Public - No authentication required for health checks
   */
  router.get('/health', pdfController.getHealth);

  return router;
};

export default createPdfRouter;
