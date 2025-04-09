export type SldSubscriptionStatus = 'connected' | 'disconnected';

export interface SldSubscriptionResponse {
  status: SldSubscriptionStatus;
}
