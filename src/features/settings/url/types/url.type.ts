import { createTaggedError, TaggedError } from '@/types/tagged-error.type';

/**
 * Response object for server URL operations
 */
export interface ServerUrlResponse {
  /**
   * Status of the server URL configuration
   * "configured" - URL is set
   * "cleared" - URL has been removed
   * "not_configured" - No URL has been set
   */
  status: 'configured' | 'cleared' | 'not_configured';

  /**
   * The server URL value
   */
  url: string;
}

/**
 * Interface for server URL errors
 */
export type ServerUrlError = TaggedError<'ServerUrlError'>;

/**
 * Factory function to create a ServerUrlError
 */
export const createServerUrlError = (
  message: string,
  cause?: unknown,
): ServerUrlError => createTaggedError('ServerUrlError', message, cause);
