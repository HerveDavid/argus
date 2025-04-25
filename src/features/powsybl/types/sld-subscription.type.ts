export type SldSubscriptionStatus = 'connected' | 'disconnected';

export interface SldSubscriptionResponse {
  readonly status: SldSubscriptionStatus;
}
