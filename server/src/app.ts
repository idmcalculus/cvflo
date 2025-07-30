import * as expressModule from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { errorHandler } from './middleware/errorHandler.ts';
import { applySecurityMiddleware } from './middleware/security.ts';
import config from './config/index.ts';
import { createAppLogger } from './utils/logger.ts';
import { BadRequestError } from './utils/errors.ts';

// Get Express function
const express = expressModule.default || expressModule;
const logger = createAppLogger();
type Express = ReturnType<typeof express>;

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize Express application with all middleware and routes
 * Following the Dependency Inversion Principle
 */
export const createApp = async (): Promise<Express> => {
  const app = express();

  // Apply security middleware (CORS, Helmet, Rate Limiting)
  applySecurityMiddleware(app);
  
  // Body parsing middleware - use alternatives without relying on express methods
  app.use((req, res, next) => {
    if (req.headers['content-type']?.includes('application/json')) {
      req.body = {};
      let data = '';
      req.on('data', (chunk) => {
        data += chunk.toString();
      });
      req.on('end', () => {
        try {
          if (data) { // Only parse if data is not empty
            req.body = JSON.parse(data);
          } // If data is empty, req.body remains the initialized {} which is acceptable
          next();
        } catch { // Error object not needed here
          // Use BadRequestError for proper handling by the global error handler
          next(new BadRequestError('Invalid JSON format'));
        }
      });
      // Handle errors on the request stream itself
      req.on('error', (err) => {
        next(err);
      });
    } else {
      next();
    }
  });
  
  // URL Encoded middleware
  app.use((req, res, next) => {
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      req.body = {};
      let data = '';
      req.on('data', (chunk) => {
        data += chunk.toString();
      });
      req.on('end', () => {
        try {
          const params = new URLSearchParams(data);
          req.body = Object.fromEntries(params);
          next();
        } catch {
          next(new Error('Invalid form data format'));
        }
      });
    } else {
      next();
    }
  });

  // Dynamically import dependencies to allow for easier testing and mocking
  const { PdfService } = await import('./services/pdfService.ts');
  const { PdfController } = await import('./controllers/pdfController.ts');
  const createPdfRouter = (await import('./routes/pdfRoutes.ts')).default;
  const { cvRoutes } = await import('./routes/cvRoutes.ts');

  // Create instances of services and controllers
  const pdfService = new PdfService();
  const pdfController = new PdfController(pdfService);

  // Create and use the routers
  const pdfRoutes = createPdfRouter(pdfController);
  app.use('/api', pdfRoutes);
  app.use('/api/cv', cvRoutes);
  
  // Serve static files from the 'public' directory
  const publicPath = path.join(__dirname, '../public');
  app.use(expressModule.static(publicPath));

  // Fallback middleware for SPA routing. This should be after all other routes.
  app.use((req, res, next) => {
    // If the request is for an API route that was not found, pass to the error handler.
    if (req.url && req.url.startsWith('/api/')) {
      return next();
    }

    // For all other requests, serve the main app page.
    const indexPath = path.join(publicPath, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.status(404).send('index.html not found. Please run "bun run dev:full" or "bun run start:full" to build the client.');
        } else {
          next(err);
        }
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.send(data);
      }
    });
  });
  
  // Global error handler - must be applied after all routes
  app.use(errorHandler as any);
  
  return app;
};

// Helper function to determine content type based on file extension
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };
  return types[ext] || 'text/plain';
}
