import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Request, Response } from 'express';
import { AppError } from '../../src/utils/errors.ts';

// --- Mocks ---
const mockLogger = {
  error: mock(),
  warn: mock(),
  info: mock(),
  debug: mock(),
};

mock.module('../../src/utils/logger.ts', () => ({
  createAppLogger: () => mockLogger,
}));

let mockNodeEnv = 'test';
mock.module('../../src/config/index.ts', () => ({
  default: {
    get nodeEnv() {
      return mockNodeEnv;
    },
  },
}));

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof mock>;
  let mockStatus: ReturnType<typeof mock>;
  let mockJson: ReturnType<typeof mock>;

  beforeEach(() => {
    mockStatus = mock().mockReturnThis();
    mockJson = mock();
    mockNext = mock();
    mockLogger.error.mockReset();
    mockLogger.warn.mockReset();
    mockLogger.info.mockReset();
    mockLogger.debug.mockReset();

    mockReq = {
      path: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
  });

  afterEach(() => {
    mock.restore();
    mockNodeEnv = 'test'; // Reset to default
  });

  it('should handle AppError with custom status code and message', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler.ts');
    const customError = new AppError('Custom error message', 422);

    errorHandler(customError, mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(422);
    expect(mockJson).toHaveBeenCalledWith({ success: false, message: 'Custom error message' });
  });

  it('should handle generic Error with default 500 status', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler.ts');
    const genericError = new Error('Generic error');

    errorHandler(genericError, mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  it('should log server errors (5xx) with error level', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler.ts');
    const serverError = new AppError('Server error', 500);

    errorHandler(serverError, mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.error).toHaveBeenCalledWith('Server error', {
      statusCode: 500,
      message: 'Server error',
      path: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
      stack: expect.any(String),
    });
  });

  it('should log client errors (4xx) with warn level', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler.ts');
    const clientError = new AppError('Bad request', 400);

    errorHandler(clientError, mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.warn).toHaveBeenCalledWith('Client error', {
      statusCode: 400,
      message: 'Bad request',
      path: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
    });
  });

  it('should include stack trace in development mode', async () => {
    mockNodeEnv = 'development';
    const { errorHandler } = await import('../../src/middleware/errorHandler.ts');
    const error = new Error('Test error');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error',
      error: {
        stack: expect.any(String),
      },
    });
  });

  it('should not include stack trace in production mode', async () => {
    mockNodeEnv = 'production';
    const { errorHandler } = await import('../../src/middleware/errorHandler.ts');
    const error = new Error('Test error');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockJson).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  it('should handle errors without stack trace', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler.ts');
    const errorWithoutStack = new AppError('Error without stack', 500);
    delete errorWithoutStack.stack;

    errorHandler(errorWithoutStack, mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.error).toHaveBeenCalledWith('Server error', {
      statusCode: 500,
      message: 'Error without stack',
      path: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
    });
  });

  it('should handle missing request properties gracefully', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler.ts');
    const error = new AppError('Test error', 400);
    const incompleteReq = {} as Request;

    errorHandler(error, incompleteReq, mockRes as Response, mockNext);

    expect(mockLogger.warn).toHaveBeenCalledWith('Client error', {
      statusCode: 400,
      message: 'Test error',
      path: undefined,
      method: undefined,
      ip: undefined,
    });
  });
});
