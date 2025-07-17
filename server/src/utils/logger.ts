import { createLogger, format, transports } from 'winston';
import config from '../config/index.ts';

export function createAppLogger() {
  // Define log format
  const logFormat = format.combine(
    format.timestamp(),
    format.json(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    })
  );

  // Create logger instance
  const logger = createLogger({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
      // Write to console for all environments
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        ),
      }),
      // Add file transport in production
      ...(config.nodeEnv === 'production'
        ? [new transports.File({ filename: 'logs/error.log', level: 'error' })]
        : []),
    ],
  });

  return logger;
}


