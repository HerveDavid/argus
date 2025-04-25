export interface ZmqUrlResponse {
  status: 'configured' | 'cleared' | 'not_configured';
  url: string;
  subscription?: string;
}
