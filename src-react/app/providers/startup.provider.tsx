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
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const startupProgram = Effect.gen(function* () {
      const projectClient = yield* ProjectClient;

      yield* Effect.logInfo('Starting application...');

      // 1. Charger le projet courant
      const project = yield* projectClient.loadProject();
      yield* Effect.logInfo(`Project loaded successfully: ${project.name}`);
      yield* Effect.logInfo(`Project path: ${project.path}`);

      // 2. Initialiser automatiquement la base de données
      const dbPath = `${project.path}/.argus/network.db`;
      yield* Effect.logInfo(`Initializing database at: ${dbPath}`);

      const createdDbPath = yield* projectClient.initDatabaseProject(dbPath);
      yield* Effect.logInfo(
        `Database initialized successfully: ${createdDbPath}`,
      );

      // 3. Optionnel: Tester la base avec une requête simple
      const busCount = yield* projectClient.queryProject(
        'SELECT COUNT(*) as count FROM buses',
      );
      yield* Effect.logInfo(
        `Network contains ${busCount.data[0]?.count || 0} buses`,
      );

      yield* Effect.logInfo('Application startup completed successfully');

      return {
        project,
        dbPath: createdDbPath,
        busCount: busCount.data[0]?.count || 0,
      };
    });

    // Exécuter le programme de startup avec gestion d'erreurs
    runtime
      .runPromise(
        startupProgram.pipe(
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              yield* Effect.logError(`Startup failed: ${error.message}`);
              return Effect.fail(error);
            }),
          ),
        ),
      )
      .then((result) => {
        console.log('Startup completed:', result);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Startup failed:', error);
        setError(error.message || 'Application startup failed');
        setIsLoading(false);
      });
  }, [runtime]);

  // Affichage de loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">
            Loading project and initializing database...
          </p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Startup Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
