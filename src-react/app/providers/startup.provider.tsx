import { Effect } from 'effect';
import React from 'react';

import { ProjectClient } from '@/services/common/project-client';
import { useRuntime } from '@/services/runtime/use-runtime';

export const StartupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const runtime = useRuntime();
  const startedRef = React.useRef(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const program = Effect.gen(function* () {
      const projectClient = yield* ProjectClient;
      const project = yield* projectClient.loadProject();
      yield* Effect.logInfo('Project loaded successfully', { project });

      yield* Effect.logInfo('Application started successfully');
    });

    runtime.runPromise(program).then(() => setIsLoading(false));
  }, [runtime]);

  if (isLoading) return <>Loading</>;

  return <>{children}</>;
};
