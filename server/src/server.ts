import { createApp } from './app.ts';
import { createAppLogger } from './utils/logger.ts';
import config from './config/index.ts';
import { getPuppeteerPool, shutdownPuppeteerPool } from './services/puppeteerPool.ts';

const logger = createAppLogger(); // Create a logger instance for general use

const startServer = async () => {
  try {
    const port = config.port;
    const app = await createApp();

    // Initialize and warm up the Puppeteer pool
    logger.info('Initializing Puppeteer pool...');
    const pool = getPuppeteerPool();
    await pool.warmUp();
    logger.info('Puppeteer pool initialized and warmed up');

    const server = app.listen(port, () => {
      logger.info(`Server is running in ${config.nodeEnv} mode on port ${port}`);
      logger.info(`Using Bun runtime version: ${Bun.version}`);
      logger.info(`Puppeteer pool stats: ${JSON.stringify(pool.getStats())}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      
      // Close the server first
      server.close(async () => {
        logger.info('Server closed.');
        
        // Clean up Puppeteer pool
        try {
          await shutdownPuppeteerPool();
          logger.info('Puppeteer pool cleaned up.');
        } catch (error) {
          logger.error('Error cleaning up Puppeteer pool', { error });
        }
        
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('Failed to start server', { error: message, stack });
    process.exit(1);
  }
};

// Handle uncaught exceptions to prevent server crash
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : 'An unknown error occurred';
  const stack = reason instanceof Error ? reason.stack : undefined;
  logger.error('Unhandled promise rejection', { reason: message, stack });
  process.exit(1);
});

startServer();
