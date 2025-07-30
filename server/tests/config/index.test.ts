import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';

describe('Config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset modules and environment variables before each test
    mock.restore();
    process.env = { ...originalEnv };
    // Explicitly clear env vars that are being tested for default values
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.CLIENT_URL;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX;
  });

  afterEach(() => {
    // Restore original environment variables after each test
    process.env = originalEnv;
  });

  it('should load default values when environment variables are not set', async () => {
    // Mock dotenv to do nothing, preventing it from reading a real .env file
    mock.module('dotenv', () => ({ config: () => {} }));

    // @ts-expect-error - Dynamic import with query string for isolation
    const config = (await import(`../../src/config/index.ts?default`)).default;

    expect(config.port).toBe(5001);
    expect(config.nodeEnv).toBe('development');
    expect(config.clientUrl).toBe('http://localhost:3000');
    expect(config.rateLimitWindow).toBe(15 * 60 * 1000); // 15 minutes
    expect(config.rateLimitMax).toBe(100);
  });

  it('should use environment variables when they are set', async () => {
    // Set environment variables
    process.env.PORT = '8080';
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://myapp.com';
    process.env.RATE_LIMIT_WINDOW_MS = '600000'; // 10 minutes
    process.env.RATE_LIMIT_MAX = '50';

    // Mock dotenv to do nothing
    mock.module('dotenv', () => ({ config: () => {} }));

    // @ts-expect-error - Dynamic import with query string for isolation
    const config = (await import(`../../src/config/index.ts?env_set`)).default;

    expect(config.port).toBe(8080); // Now expecting a number
    expect(config.nodeEnv).toBe('production');
    expect(config.clientUrl).toBe('https://myapp.com');
    expect(config.rateLimitWindow).toBe(600000);
    expect(config.rateLimitMax).toBe(50);
  });

  it('should handle invalid numeric environment variables gracefully', async () => {
    process.env.RATE_LIMIT_WINDOW_MS = 'invalid';
    process.env.RATE_LIMIT_MAX = 'not-a-number';

    mock.module('dotenv', () => ({ config: () => {} }));

    // @ts-expect-error - Dynamic import with query string for isolation
    const config = (await import(`../../src/config/index.ts?invalid_numeric`)).default;

    // Should fallback to default values
    expect(config.rateLimitWindow).toBe(15 * 60 * 1000);
    expect(config.rateLimitMax).toBe(100);
  });

  it('should call dotenv.config to load .env file', async () => {
    const mockDotenvConfig = mock(() => {});
    mock.module('dotenv', () => ({ config: mockDotenvConfig }));

    // Import the module to trigger the config load
    // @ts-expect-error - Dynamic import with query string for isolation
    await import(`../../src/config/index.ts?dotenv_call`);

    expect(mockDotenvConfig).toHaveBeenCalledTimes(1);
  });

  it('should handle zero values for numeric environment variables by falling back to defaults', async () => {
    process.env.RATE_LIMIT_WINDOW_MS = '0';
    process.env.RATE_LIMIT_MAX = '0';

    mock.module('dotenv', () => ({ config: () => {} }));

    // @ts-expect-error - Dynamic import with query string for isolation
    const config = (await import(`../../src/config/index.ts?zero_values`)).default;

    // The new getNumber helper treats 0 as a reason to fallback
    expect(config.rateLimitWindow).toBe(15 * 60 * 1000);
    expect(config.rateLimitMax).toBe(100);
  });

  it('should handle empty string environment variables', async () => {
    process.env.PORT = '';
    process.env.NODE_ENV = '';
    process.env.CLIENT_URL = '';

    mock.module('dotenv', () => ({ config: () => {} }));

    // @ts-expect-error - Dynamic import with query string for isolation
    const config = (await import(`../../src/config/index.ts?empty_string`)).default;

    // The helpers should fallback to defaults for empty strings
    expect(config.port).toBe(5001);
    expect(config.nodeEnv).toBe('development');
    expect(config.clientUrl).toBe('http://localhost:3000');
  });
});
