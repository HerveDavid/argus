export interface FetchOptions {
    method: string;
    headers: Record<string, string>;
    proxy?: {
      all: {
        url: string;
        noProxy: string;
      };
    };
  }