export interface NatsConnectionStatus {
  connected: boolean;
  address: string;
  active_channels: number;
  channel_names: string[];
}

export interface NatsAddressResponse {
  address: string;
  message: string;
}

export interface NatsConnectionResponse {
  success: boolean;
  address: string;
  message: string;
}

export interface NatsDisconnectionResponse {
  success: boolean;
  message: string;
  channels_stopped: number;
}
