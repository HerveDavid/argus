// api-utils.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleApiError } from './api-utils';

describe('handleApiError', () => {
  // Spy on console.error to verify it's called correctly
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.resetAllMocks();
  });

  it('should handle Error objects correctly', () => {
    const error = new Error('Network error');
    const context = 'API Call';

    const result = handleApiError(error, context);

    expect(console.error).toHaveBeenCalledWith(`Error in ${context}:`, error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(`${context}: ${error.message}`);
  });

  it('should handle string errors correctly', () => {
    const error = 'Simple string error';
    const context = 'Data Processing';

    const result = handleApiError(error, context);

    expect(console.error).toHaveBeenCalledWith(`Error in ${context}:`, error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(`${context}: ${error}`);
  });

  it('should handle numeric error codes', () => {
    const error = 404;
    const context = 'HTTP Request';

    const result = handleApiError(error, context);

    expect(console.error).toHaveBeenCalledWith(`Error in ${context}:`, error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(`${context}: ${error}`);
  });

  it('should handle object errors correctly', () => {
    const error = { code: 500, message: 'Internal Server Error' };
    const context = 'Backend API';

    const result = handleApiError(error, context);

    expect(console.error).toHaveBeenCalledWith(`Error in ${context}:`, error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(`${context}: ${String(error)}`);
  });

  it('should handle null errors', () => {
    const error = null;
    const context = 'Data Validation';

    const result = handleApiError(error, context);

    expect(console.error).toHaveBeenCalledWith(`Error in ${context}:`, error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(`${context}: null`);
  });

  it('should handle undefined errors', () => {
    const error = undefined;
    const context = 'Configuration';

    const result = handleApiError(error, context);

    expect(console.error).toHaveBeenCalledWith(`Error in ${context}:`, error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(`${context}: undefined`);
  });

  it('should preserve error chain for nested errors', () => {
    const originalError = new Error('Original error');
    const wrappedError = new Error('Wrapped error');
    (wrappedError as any).cause = originalError;

    const context = 'Nested Operation';

    const result = handleApiError(wrappedError, context);

    expect(console.error).toHaveBeenCalledWith(
      `Error in ${context}:`,
      wrappedError,
    );
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(`${context}: ${wrappedError.message}`);
  });
});
