import LoadingScreen from '@/features/loading-screen';
import { Providers } from './provider';
import { StartLoadingGate } from './providers/start.provider';
import { AppRouter } from './router';

export const App = () => {
  return (
    <Providers>
      <StartLoadingGate fallback={<LoadingScreen />}>
        <AppRouter />
      </StartLoadingGate>
    </Providers>
  );
};
