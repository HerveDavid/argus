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
