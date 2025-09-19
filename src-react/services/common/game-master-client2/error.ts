import { Data } from 'effect';

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
      case 'VALIDATION_ERROR':
        return `Erreur de validation: ${this.message}`;
      case 'HTTP_ERROR':
        return `Erreur HTTP: ${this.message}`;
      default:
        return this.message;
    }
  }

  get isRetryable(): boolean {
    return this.code === 'LOCK_ERROR' || this.code === 'HTTP_ERROR';
  }

  get severity(): 'low' | 'medium' | 'high' {
    switch (this.code) {
      case 'NOT_FOUND':
      case 'VALIDATION_ERROR':
        return 'medium';
      case 'ALREADY_EXISTS':
        return 'low';
      case 'LOCK_ERROR':
      case 'HTTP_ERROR':
        return 'high';
      default:
        return 'medium';
    }
  }
}

export class GameMasterHttpError extends GameMasterError {
  readonly status: number;
  readonly details?: Record<string, any>;

  constructor(props: {
    readonly message: string;
    readonly status: number;
    readonly details?: Record<string, any>;
  }) {
    super({
      message: props.message,
      code: 'HTTP_ERROR',
      details: props.details,
    });
    this.status = props.status;
    this.details = props.details;
  }

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

export class GameMasterValidationError extends GameMasterError {
  readonly status: number;
  readonly validationErrors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  constructor(props: {
    readonly message: string;
    readonly status: number;
    readonly validationErrors?: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  }) {
    super({
      message: props.message,
      code: 'VALIDATION_ERROR',
    });
    this.status = props.status;
    this.validationErrors = props.validationErrors;
  }

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

export class GameMasterNetworkError extends GameMasterError {
  readonly originalError?: Error;

  constructor(props: {
    readonly message: string;
    readonly originalError?: Error;
  }) {
    super({
      message: props.message,
      code: 'NETWORK_ERROR',
    });
    this.originalError = props.originalError;
  }

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

export class GameMasterTimeoutError extends GameMasterError {
  readonly timeout: number;

  constructor(props: { readonly message: string; readonly timeout: number }) {
    super({
      message: props.message,
      code: 'TIMEOUT_ERROR',
    });
    this.timeout = props.timeout;
  }

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

// Helper types pour une utilisation plus typée
export type GameMasterErrors =
  | GameMasterError
  | GameMasterHttpError
  | GameMasterValidationError
  | GameMasterNetworkError
  | GameMasterTimeoutError;

// Utility functions pour la gestion d'erreurs
// export const isHttpError = (
//   error: GameMasterErrors,
// ): error is GameMasterHttpError => {
//   return error._tag === 'GameMasterHttpError';
// };

// export const isValidationError = (
//   error: GameMasterErrors,
// ): error is GameMasterValidationError => {
//   return error._tag === 'GameMasterValidationError';
// };

// export const isNetworkError = (
//   error: GameMasterErrors,
// ): error is GameMasterNetworkError => {
//   return error._tag === 'GameMasterNetworkError';
// };

// export const isTimeoutError = (
//   error: GameMasterErrors,
// ): error is GameMasterTimeoutError => {
//   return error._tag === 'GameMasterTimeoutError';
// };

export const isRetryableError = (error: GameMasterErrors): boolean => {
  if ('isRetryable' in error) {
    return error.isRetryable;
  }
  return false;
};
