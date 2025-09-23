import { Effect } from 'effect';
import { withToast } from '../utils';

const createToastConfig = (operation: string) => ({
  success: {
    title: (result: { message?: string }) =>
      result.message ?? `${operation} succeed`,
    duration: 3000,
  },
  error: {
    title: () => `${operation} failed`,
    duration: 5000,
  },
});

export const withGameMasterToast = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  operation: string,
  showToast = true,
) => (showToast ? withToast(effect, createToastConfig(operation)) : effect);
