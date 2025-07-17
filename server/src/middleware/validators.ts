import { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import { BadRequestError } from '../utils/errors.ts';

/**
 * Validate PDF generation request
 * Checks if CV data and visibility settings are provided and have the required format
 */
export const validatePdfRequest = [
  check('cvData')
    .exists()
    .withMessage('CV data is required')
    .notEmpty()
    .withMessage('CV data cannot be empty'),
  
  check('visibility')
    .exists()
    .withMessage('Visibility settings are required')
    .notEmpty()
    .withMessage('Visibility settings cannot be empty')
    .isObject()
    .withMessage('Visibility must be an object'),
  
  // Add validation errors to the request
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      next(new BadRequestError(errorMessages));
      return;
    }
    
    next();
  }
];
