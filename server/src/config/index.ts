import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();

const getNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  // Fallback if not a number or is zero
  return isNaN(num) || num === 0 ? defaultValue : num;
};

const getString = (value: string | undefined, defaultValue: string): string => {
  // Fallback if undefined or empty string
  return value || defaultValue;
};

const config = {
  port: getNumber(process.env.PORT, 5001),
  nodeEnv: getString(process.env.NODE_ENV, 'development'),
  clientUrl: getString(process.env.CLIENT_URL, 'http://localhost:3000'),
  rateLimitWindow: getNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
  rateLimitMax: getNumber(process.env.RATE_LIMIT_MAX, 300), // limit each IP to 300 requests per window
};

export default config;
