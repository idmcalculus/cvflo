import { Router } from 'express';
import type { PdfController } from '../controllers/pdfController.ts';
import { validatePdfRequest } from '../middleware/validators.ts';

const createPdfRouter = (pdfController: PdfController) => {
  const router = Router();

  /**
   * @route POST /generate-pdf
   * @desc Generate PDF from CV data
   * @access Public
   */
  router.post('/generate-pdf', validatePdfRequest, pdfController.generatePdf);

  /**
   * @route GET /templates
   * @desc Get available CV templates
   * @access Public
   */
  router.get('/templates', pdfController.getTemplates);

  /**
   * @route POST /generate-preview
   * @desc Generate HTML preview from CV data
   * @access Public
   */
  router.post('/generate-preview', validatePdfRequest, pdfController.generatePreview);

  /**
   * @route POST /generate-pdf-from-html
   * @desc Generate PDF from pre-rendered HTML content
   * @access Public
   */
  router.post('/generate-pdf-from-html', pdfController.generatePdfFromHtml);

  return router;
};

export default createPdfRouter;
