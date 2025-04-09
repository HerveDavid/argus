export enum SldSubscriptionStatus {
  Connected = 'Connected',
  Unconnected = 'Unconnected',
}

export interface SldSubscriptionResponse {
  status: SldSubscriptionStatus;
}
