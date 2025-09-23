import { Effect } from 'effect';
import { toast } from 'sonner';

interface ToastOptions {
  readonly success?: {
    readonly title?: (result: any) => string;
    readonly description?: (result: any) => string | undefined;
    readonly duration?: number;
  };
  readonly error?: {
    readonly title?: (error: any) => string;
    readonly description?: (error: any) => string | undefined;
    readonly duration?: number;
  };
}

export const withToast = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  options: ToastOptions = {},
) =>
  effect.pipe(
    Effect.tap((result) =>
      Effect.sync(() => {
        const description = options.success?.description?.(result);
        toast.success(options.success?.title?.(result) ?? 'Success!', {
          description: description || undefined,
          duration: options.success?.duration ?? 3000,
        });
      }),
    ),
    Effect.tapError((error) =>
      Effect.sync(() => {
        const description = options.error?.description?.(error);
        toast.error(options.error?.title?.(error) ?? 'Error', {
          description: description || undefined,
          duration: options.error?.duration ?? 5000,
        });
      }),
    ),
  );
