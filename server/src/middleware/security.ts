import cors from 'cors';
import helmet from 'helmet';
import { Express } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config/index.ts';

/**
 * Apply security middleware to Express application
 * Configures CORS, security headers, and rate limiting
 */
export const applySecurityMiddleware = (app: Express): void => {
  // CORS configuration
  app.use(cors({
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Security headers using Helmet - disable CSP for development
  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindow, // 15 minutes
    max: config.rateLimitMax, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  
  // Apply rate limiting to all requests
  app.use(limiter);
};
