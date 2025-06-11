import { Providers } from './provider';
import { AppRouter } from './router';

export const App = () => {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
};
