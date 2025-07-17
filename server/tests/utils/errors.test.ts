import { describe, it, expect } from 'bun:test';
import { AppError, NotFoundError, BadRequestError, InternalServerError } from '../../src/utils/errors.ts';

describe('Custom Errors', () => {
  describe('AppError', () => {
    it('should create an instance with the correct properties', () => {
      const error = new AppError('Test error', 500, false);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
      expect(error.name).toBe('Error'); // name is 'Error' by default
    });

    it('should be operational by default', () => {
      const error = new AppError('Operational error', 400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with default message', () => {
      const error = new NotFoundError();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('Error');
    });

    it('should create a NotFoundError with a custom message', () => {
      const error = new NotFoundError('Custom not found message');
      expect(error.message).toBe('Custom not found message');
    });
  });

  describe('BadRequestError', () => {
    it('should create a BadRequestError with default message', () => {
      const error = new BadRequestError();
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.name).toBe('Error');
    });

    it('should create a BadRequestError with a custom message', () => {
      const error = new BadRequestError('Invalid input provided');
      expect(error.message).toBe('Invalid input provided');
    });
  });

  describe('InternalServerError', () => {
    it('should create an InternalServerError with default message', () => {
      const error = new InternalServerError();
      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
      expect(error.message).toBe('Internal server error');
      expect(error.name).toBe('Error');
    });

    it('should create an InternalServerError with a custom message', () => {
      const error = new InternalServerError('A critical error occurred');
      expect(error.message).toBe('A critical error occurred');
    });
  });
});
