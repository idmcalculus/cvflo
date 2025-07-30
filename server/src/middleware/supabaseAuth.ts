import { Request, Response, NextFunction } from 'express';
import { supabaseService, AuthUser } from '../services/supabaseService.ts';
import { BadRequestError } from '../utils/errors.ts';
import { createAppLogger } from '../utils/logger.ts';

const logger = createAppLogger();


/**
 * Extract Bearer token from Authorization header
 */
const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Supabase authentication middleware - protects routes that require authentication
 */
export const requireSupabaseAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
        message: 'Please provide a valid authentication token in the Authorization header.'
      });
      return;
    }

    // Verify token with Supabase
    const user = await supabaseService.verifyToken(token);
    req.user = user;

    // Ensure user profile exists (create if first time)
    await supabaseService.upsertUserProfile(user);
    
    logger.info('User authenticated successfully', { 
      userId: user.id, 
      email: user.email,
      ip: req.ip 
    });
    
    next();
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(401).json({
        error: error.message,
        code: 'INVALID_TOKEN',
        message: 'The provided token is invalid or expired. Please log in again.'
      });
      return;
    }
    
    logger.error('Authentication error', { error, ip: req.ip });
    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
      message: 'An error occurred during authentication. Please try again.'
    });
  }
};

/**
 * Optional Supabase authentication middleware - doesn't block if no token
 * but populates req.user if valid token is provided
 */
export const optionalSupabaseAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      try {
        const user = await supabaseService.verifyToken(token);
        req.user = user;
        
        // Ensure user profile exists (create if first time)
        await supabaseService.upsertUserProfile(user);
        
        logger.info('Optional auth: User authenticated', { 
          userId: user.id, 
          email: user.email 
        });
      } catch (error) {
        // Invalid token, but don't block the request
        logger.warn('Optional auth: Invalid token provided', { error });
        req.user = undefined;
      }
    }
    
    next();
  } catch (error) {
    // Don't block the request even if there's an error
    logger.warn('Optional auth: Authentication error', { error });
    next();
  }
};

/**
 * Rate limiting middleware for authenticated users based on PDF generation
 */
export const createPDFRateLimit = (windowMs: number, maxRequests: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // If no user, let the general rate limiter handle it
      if (!req.user) {
        next();
        return;
      }
      
      const userId = req.user.id;
      const count = await supabaseService.getPDFGenerationCount(userId, windowMs);
      
      if (count >= maxRequests) {
        const resetTime = Math.ceil(windowMs / 1000);
        res.status(429).json({
          error: 'PDF generation rate limit exceeded',
          code: 'PDF_RATE_LIMIT_EXCEEDED',
          message: `You have exceeded the limit of ${maxRequests} PDF generations per ${Math.ceil(windowMs / 60000)} minutes.`,
          retryAfter: resetTime,
          currentUsage: count,
          limit: maxRequests
        });
        return;
      }
      
      next();
    } catch (error) {
      logger.error('Rate limiting error', { error, userId: req.user?.id });
      // Don't block the request if rate limiting fails
      next();
    }
  };
};

/**
 * Middleware to track PDF generation for analytics
 */
export const trackPDFGeneration = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      const templateName = req.body?.templateName || 'unknown';
      
      // Track the generation (fire and forget)
      supabaseService.trackPDFGeneration(req.user.id, templateName).catch(error => {
        logger.warn('Failed to track PDF generation', { 
          userId: req.user?.id, 
          templateName, 
          error 
        });
      });
    }
    
    next();
  } catch (error) {
    // Don't block the request if tracking fails
    logger.warn('PDF tracking middleware error', { error });
    next();
  }
};