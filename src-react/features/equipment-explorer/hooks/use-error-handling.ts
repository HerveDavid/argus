import { useState } from 'react';

export type ErrorWithRetry = {
  error: Error;
  retry: () => void;
};

export const useErrorHandling = () => {
  const [errors, setErrors] = useState<Record<string, ErrorWithRetry>>({});

  const setError = (key: string, error: unknown, retry: () => void) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setErrors((prev) => ({
      ...prev,
      [key]: {
        error: new Error(errorMessage),
        retry,
      },
    }));
  };

  const clearError = (key: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors: Object.keys(errors).length > 0,
  };
};
