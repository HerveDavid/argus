import { Toaster } from '@/components/ui/sonner';

import { Providers } from './provider';
import { AppRouter } from './router';

export const App = () => {
  return (
    <Providers>
      <AppRouter />
      <Toaster />
    </Providers>
  );
};
