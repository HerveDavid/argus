// errors.ts
import { Data } from 'effect';

// Base error class
export class GameMasterError extends Data.TaggedError('GameMasterError')<{
  readonly message: string;
  readonly code?: string;
  readonly details?: Record<string, any>;
}> {
  get displayMessage(): string {
    switch (this.code) {
      case 'NOT_FOUND':
        return `Ressource introuvable: ${this.message}`;
      case 'ALREADY_EXISTS':
        return `Ressource déjà existante: ${this.message}`;
      case 'LOCK_ERROR':
        return `Erreur de verrous: ${this.message}`;
      default:
        return this.message;
    }
  }

  get isRetryable(): boolean {
    return this.code === 'LOCK_ERROR';
  }

  get severity(): 'low' | 'medium' | 'high' {
    switch (this.code) {
      case 'NOT_FOUND':
        return 'medium';
      case 'ALREADY_EXISTS':
        return 'low';
      case 'LOCK_ERROR':
        return 'high';
      default:
        return 'medium';
    }
  }
}

// HTTP specific error
export class GameMasterHttpError extends Data.TaggedError(
  'GameMasterHttpError',
)<{
  readonly message: string;
  readonly status: number;
  readonly details?: Record<string, any>;
}> {
  get displayMessage(): string {
    switch (this.status) {
      case 400:
        return `Requête invalide: ${this.message}`;
      case 401:
        return `Non autorisé: ${this.message}`;
      case 403:
        return `Accès interdit: ${this.message}`;
      case 404:
        return `Ressource non trouvée: ${this.message}`;
      case 409:
        return `Conflit: ${this.message}`;
      case 422:
        return `Données invalides: ${this.message}`;
      case 500:
        return `Erreur serveur interne: ${this.message}`;
      case 503:
        return `Service indisponible: ${this.message}`;
      default:
        return `Erreur HTTP ${this.status}: ${this.message}`;
    }
  }

  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 503;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get severity(): 'low' | 'medium' | 'high' {
    if (this.status >= 500) return 'high';
    if (this.status >= 400) return 'medium';
    return 'low';
  }
}

// Validation specific error
export class GameMasterValidationError extends Data.TaggedError(
  'GameMasterValidationError',
)<{
  readonly message: string;
  readonly status: number;
  readonly validationErrors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}> {
  get displayMessage(): string {
    if (this.validationErrors && this.validationErrors.length > 0) {
      const errors = this.validationErrors
        .map((err) => `${err.field}: ${err.message}`)
        .join(', ');
      return `Erreurs de validation: ${errors}`;
    }
    return `Erreur de validation: ${this.message}`;
  }

  get fieldErrors(): Record<string, string> {
    if (!this.validationErrors) return {};

    return this.validationErrors.reduce(
      (acc, err) => {
        acc[err.field] = err.message;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  get isRetryable(): boolean {
    return false;
  }

  get severity(): 'low' | 'medium' | 'high' {
    return 'medium';
  }
}

// Network specific error
export class GameMasterNetworkError extends Data.TaggedError(
  'GameMasterNetworkError',
)<{
  readonly message: string;
  readonly originalError?: Error;
}> {
  get displayMessage(): string {
    return `Erreur réseau: ${this.message}`;
  }

  get isRetryable(): boolean {
    return true;
  }

  get severity(): 'low' | 'medium' | 'high' {
    return 'high';
  }
}

// Timeout specific error
export class GameMasterTimeoutError extends Data.TaggedError(
  'GameMasterTimeoutError',
)<{
  readonly message: string;
  readonly timeout: number;
}> {
  get displayMessage(): string {
    return `Timeout après ${this.timeout}ms: ${this.message}`;
  }

  get isRetryable(): boolean {
    return true;
  }

  get severity(): 'low' | 'medium' | 'high' {
    return 'high';
  }
}

// Union type for all errors
export type GameMasterErrors =
  | GameMasterError
  | GameMasterHttpError
  | GameMasterValidationError
  | GameMasterNetworkError
  | GameMasterTimeoutError;

// Utility function
export const isRetryableError = (error: GameMasterErrors): boolean => {
  if ('isRetryable' in error) {
    return error.isRetryable;
  }
  return false;
};
