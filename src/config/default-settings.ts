import { setServerUrl } from '@/features/settings/components/url/api';
import { ServerUrlError } from '@/features/settings/components/url/types/url.type';

const handleServerConfig = async (serverConfig: {
  url: string;
  status: string;
}) => {
  try {
    const { url } = serverConfig;
    await setServerUrl(url);
  } catch (err) {
    const serverError = err as ServerUrlError;
    throw serverError;
  }
};

export const defaultSettings = [
  {
    key: 'server_url',
    defaultValue: {
      url: '',
      status: 'not_configured',
    },
    handler: handleServerConfig,
  },
  {
    key: 'preferences',
    defaultValue: {
      theme: 'light',
    },
  },
];
