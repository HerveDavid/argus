export interface Proxy {
  username?: string;
  password?: string;
  no_proxy: string;
  url: string;
}

export interface ProxyResponse {
  status: string;
  url: string;
  no_proxy: string;
}
