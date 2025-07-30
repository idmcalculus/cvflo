import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../src/utils/errors.ts';

// Mock express-validator using Bun's mocking API
const mockChain = {
  exists: mock().mockReturnThis(),
  withMessage: mock().mockReturnThis(),
  notEmpty: mock().mockReturnThis(),
  isObject: mock().mockReturnThis(),
  optional: mock().mockReturnThis(),
  isInt: mock().mockReturnThis(),
};

const mockCheck = mock(() => mockChain);
const mockValidationResult = mock();

mock.module('express-validator', () => ({
  check: mockCheck,
  validationResult: mockValidationResult,
}));

describe('Validators Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof mock>;

  beforeEach(() => {
    // Clear mock history before each test
    mockCheck.mockClear();
    mockChain.exists.mockClear();
    mockChain.withMessage.mockClear();
    mockChain.notEmpty.mockClear();
    mockChain.isObject.mockClear();
    mockChain.optional.mockClear();
    mockChain.isInt.mockClear();
    mockValidationResult.mockClear();

    mockNext = mock();
    mockReq = { body: {} };
    mockRes = {}; // Not used in these tests
  });

  afterEach(() => {
    mock.restore();
  });

  describe('validatePdfRequest', () => {
    it('should create the correct validation chain', async () => {
      await import('../../src/middleware/validators.ts');

      // Verify that the validation chains were set up as expected
      expect(mockCheck).toHaveBeenCalledWith('cvData');
      expect(mockCheck).toHaveBeenCalledWith('visibility');
      expect(mockChain.exists).toHaveBeenCalledTimes(2);
      expect(mockChain.notEmpty).toHaveBeenCalledTimes(4); // Updated for skills validation
      expect(mockChain.isObject).toHaveBeenCalledTimes(1);
    });

    it('should call next() without arguments when validation passes', async () => {
      mockValidationResult.mockReturnValue({ isEmpty: () => true });

      const { validatePdfRequest } = await import('../../src/middleware/validators.ts');
      const validationHandler = validatePdfRequest[validatePdfRequest.length - 1] as (req: Request, res: Response, next: NextFunction) => void;

      validationHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() with a BadRequestError when validation fails', async () => {
      const mockErrors = [{ msg: 'Error 1' }, { msg: 'Error 2' }];
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      const { validatePdfRequest } = await import('../../src/middleware/validators.ts');
      const validationHandler = validatePdfRequest[validatePdfRequest.length - 1] as (req: Request, res: Response, next: NextFunction) => void;

      validationHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Error 1, Error 2');
    });
  });
});
