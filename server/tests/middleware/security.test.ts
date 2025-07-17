import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Express } from 'express';

// Mock functions for dependencies
const mockCors = mock(() => 'cors-middleware');
const mockHelmet = mock(() => 'helmet-middleware');
const mockRateLimit = mock(() => 'rate-limiter-middleware');

// Mock the modules that don't change
mock.module('cors', () => ({ default: mockCors }));
mock.module('helmet', () => ({ default: mockHelmet }));
mock.module('express-rate-limit', () => ({ default: mockRateLimit }));

// Mock config with mutable properties
const mockConfig = {
  clientUrl: 'http://localhost:3000',
  rateLimitWindow: 900000,
  rateLimitMax: 100,
};
mock.module('../../src/config/index.ts', () => ({
  default: mockConfig,
}));

describe('Security Middleware', () => {
  let mockApp: Express;
  let mockUse: ReturnType<typeof mock>;

  beforeEach(() => {
    // Reset call history for mocks
    mockCors.mockClear();
    mockHelmet.mockClear();
    mockRateLimit.mockClear();

    // Reset config to default values
    mockConfig.clientUrl = 'http://localhost:3000';
    mockConfig.rateLimitWindow = 900000;
    mockConfig.rateLimitMax = 100;

    mockUse = mock();
    mockApp = {
      use: mockUse,
    } as unknown as Express;
  });

  afterEach(() => {
    // This is important to undo the mocks between tests
    mock.restore();
  });

  it('should apply CORS middleware with correct configuration', async () => {
    const { applySecurityMiddleware } = await import('../../src/middleware/security.ts');
    applySecurityMiddleware(mockApp);

    expect(mockCors).toHaveBeenCalledWith({
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
    expect(mockUse).toHaveBeenCalledWith('cors-middleware');
  });

  it('should apply Helmet middleware', async () => {
    const { applySecurityMiddleware } = await import('../../src/middleware/security.ts');
    applySecurityMiddleware(mockApp);

    expect(mockHelmet).toHaveBeenCalled();
    expect(mockUse).toHaveBeenCalledWith('helmet-middleware');
  });

  it('should apply rate limiting middleware with correct configuration', async () => {
    const { applySecurityMiddleware } = await import('../../src/middleware/security.ts');
    applySecurityMiddleware(mockApp);

    expect(mockRateLimit).toHaveBeenCalledWith({
      windowMs: 900000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    });
    expect(mockUse).toHaveBeenCalledWith('rate-limiter-middleware');
  });

  it('should apply all middleware in correct order', async () => {
    const { applySecurityMiddleware } = await import('../../src/middleware/security.ts');
    applySecurityMiddleware(mockApp);

    expect(mockUse).toHaveBeenCalledTimes(3);

    const calls = mockUse.mock.calls;
    expect(calls[0][0]).toBe('cors-middleware');
    expect(calls[1][0]).toBe('helmet-middleware');
    expect(calls[2][0]).toBe('rate-limiter-middleware');
  });
});
