import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type winston from 'winston';

// Mock the dependencies at the top level
const mockCreateLogger = mock();
const mockConsoleTransport = mock();
const mockFileTransport = mock();
const mockCombine = mock(() => 'combined');
const mockTimestamp = mock(() => 'timestamp');
const mockJson = mock(() => 'json');
const mockPrintf = mock(() => 'printf');
const mockColorize = mock(() => 'colorize');
const mockSimple = mock(() => 'simple');

mock.module('winston', () => ({
  createLogger: mockCreateLogger,
  format: {
    combine: mockCombine,
    timestamp: mockTimestamp,
    json: mockJson,
    printf: mockPrintf,
    colorize: mockColorize,
    simple: mockSimple,
  },
  transports: {
    Console: mockConsoleTransport,
    File: mockFileTransport,
  },
}));

describe('createAppLogger', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure a clean state
    mockCreateLogger.mockClear();
    mockConsoleTransport.mockClear();
    mockFileTransport.mockClear();
  });

  it('should create logger with correct settings for production', async () => {
    // --- Arrange ---
    // Mock config for 'production' environment
    mock.module('../../src/config/index.ts', () => ({
      default: { nodeEnv: 'production' },
    }));

    // --- Act ---
    // @ts-expect-error - Suppress error for dynamic import with query string
    const { createAppLogger } = await import(`../../src/utils/logger.ts?env=prod`);
    createAppLogger();

    // --- Assert ---
    expect(mockCreateLogger).toHaveBeenCalledTimes(1);
    const loggerOptions = mockCreateLogger.mock.calls[0][0] as winston.LoggerOptions;

    expect(loggerOptions.level).toBe('info');
    expect(loggerOptions.transports).toHaveLength(2);
    expect(mockConsoleTransport).toHaveBeenCalledTimes(1);
    expect(mockFileTransport).toHaveBeenCalledTimes(1);
    expect(mockFileTransport).toHaveBeenCalledWith({ filename: 'logs/error.log', level: 'error' });
  });

  it('should create logger with correct settings for development', async () => {
    // --- Arrange ---
    // Mock config for 'development' environment
    mock.module('../../src/config/index.ts', () => ({
      default: { nodeEnv: 'development' },
    }));

    // --- Act ---
    // @ts-expect-error - Suppress error for dynamic import with query string
    const { createAppLogger } = await import(`../../src/utils/logger.ts?env=dev`);
    createAppLogger();

    // --- Assert ---
    expect(mockCreateLogger).toHaveBeenCalledTimes(1);
    const loggerOptions = mockCreateLogger.mock.calls[0][0] as winston.LoggerOptions;

    expect(loggerOptions.level).toBe('debug');
    expect(loggerOptions.transports).toHaveLength(1);
    expect(mockConsoleTransport).toHaveBeenCalledTimes(1);
    expect(mockFileTransport).not.toHaveBeenCalled();
  });
});
