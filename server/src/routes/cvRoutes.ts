import { Router } from 'express';
import { CVController } from '../controllers/cvController.ts';
import { requireSupabaseAuth } from '../middleware/supabaseAuth.ts';
import { createAppLogger } from '../utils/logger.ts';

const router = Router();
const cvController = new CVController();
const logger = createAppLogger();

// Apply authentication middleware to all CV routes
router.use(requireSupabaseAuth);

/**
 * @route   GET /api/cv/data
 * @desc    Get CV data for authenticated user
 * @access  Private
 */
router.get('/data', (req, res, next) => {
  logger.info('GET /api/cv/data - Fetching CV data', { 
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip 
  });
  cvController.getCVData(req, res, next);
});

/**
 * @route   POST /api/cv/data
 * @desc    Save/Create CV data for authenticated user
 * @access  Private
 */
router.post('/data', (req, res, next) => {
  logger.info('POST /api/cv/data - Saving CV data', { 
    userId: req.user?.id,
    templateName: req.body.selectedTemplate,
    dataSize: req.body.cvData ? JSON.stringify(req.body.cvData).length : 0,
    ip: req.ip 
  });
  cvController.saveCVData(req, res, next);
});

/**
 * @route   PUT /api/cv/data
 * @desc    Update CV data for authenticated user
 * @access  Private
 */
router.put('/data', (req, res, next) => {
  logger.info('PUT /api/cv/data - Updating CV data', { 
    userId: req.user?.id,
    templateName: req.body.selectedTemplate,
    hasData: !!req.body.cvData,
    ip: req.ip 
  });
  cvController.updateCVData(req, res, next);
});

/**
 * @route   DELETE /api/cv/data
 * @desc    Delete CV data for authenticated user
 * @access  Private
 */
router.delete('/data', (req, res, next) => {
  logger.info('DELETE /api/cv/data - Deleting CV data', { 
    userId: req.user?.id,
    ip: req.ip 
  });
  cvController.deleteCVData(req, res, next);
});

export { router as cvRoutes };