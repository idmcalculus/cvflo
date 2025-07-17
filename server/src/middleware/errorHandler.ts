import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.ts';
import { createAppLogger } from '../utils/logger.ts';
import config from '../config/index.ts';



/**
 * Global error handling middleware
 * Provides consistent error responses and logs errors appropriately
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const logger = createAppLogger();
  // Default values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorDetails = {};
  
  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // Add stack trace in development mode
  if (config.nodeEnv === 'development') {
    errorDetails = {
      stack: err.stack
    };
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error', {
      statusCode,
      message: String(err.message || 'Unknown server error'), // Ensure message is a string
      path: req.path,
      method: req.method,
      ip: req.ip,
      ...(err.stack ? { stack: String(err.stack) } : {}) // Ensure stack is a string if it exists
    });
  } else {
    logger.warn('Client error', {
      statusCode,
      message: String(err.message || 'Unknown client error'), // Ensure message is a string
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }

  // Send error response
  if (res.headersSent) {
    // If headers are already sent, we can't send a new response.
    // This might happen if an error occurs in a streaming response or after a response has partially been sent.
    // Delegate to the default Express error handler.
    logger.error('Headers already sent, cannot send error response', {
      statusCode,
      message: String(err.message || 'Unknown error'), // Ensure message is a string
      path: req.path,
      method: req.method,
      ip: req.ip,
      ...(err.stack ? { stack: String(err.stack) } : {}) // Ensure stack is a string if it exists
    });
    return next(err); // Important to pass the original error
  }
  res.status(statusCode).json({
    success: false,
    message: message || "An error occurred", // Ensure message is at least a default string
    ...(Object.keys(errorDetails).length > 0 ? { error: errorDetails } : {})
  });
};
