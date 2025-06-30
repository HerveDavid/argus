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

      // 2. Gérer la base de données de manière conditionnelle
      const dbPath = `${project.path}/.argus/network.db`;

      // Tenter de faire une requête simple pour tester si la DB existe et fonctionne
      const dbResult = yield* projectClient
        .queryProject('SELECT 1 as test')
        .pipe(
          Effect.match({
            onSuccess: (result) => ({ exists: true, needsInit: false, result }),
            onFailure: (error) => ({ exists: false, needsInit: true, error }),
          }),
        );

      let finalDbPath = dbPath;

      if (dbResult.needsInit) {
        yield* Effect.logInfo(
          `Database not functional, initializing at: ${dbPath}`,
        );
        finalDbPath = yield* projectClient.initDatabaseProject(dbPath);
        yield* Effect.logInfo(
          `Database initialized successfully: ${finalDbPath}`,
        );
      } else {
        yield* Effect.logInfo('Database already exists and is functional');
      }

      // 3. Tester la base avec une requête sur les buses
      const busCountResult = yield* projectClient
        .queryProject('SELECT COUNT(*) as count FROM buses')
        .pipe(
          Effect.match({
            onSuccess: (busCount) => ({
              success: true,
              count: busCount.data[0]?.count || 0,
            }),
            onFailure: (error) => ({
              success: false,
              count: 0,
              error,
            }),
          }),
        );

      if (busCountResult.success) {
        yield* Effect.logInfo(`Network contains ${busCountResult.count} buses`);
      } else {
        yield* Effect.logWarning(
          'Could not query buses table, database might be empty or tables not created yet',
        );
      }

      yield* Effect.logInfo('Application startup completed successfully');

      return {
        project,
        dbPath: finalDbPath,
        busCount: busCountResult.count,
        dbWasInitialized: dbResult.needsInit,
      };
    });

    // Exécuter le programme de startup avec gestion d'erreurs
    runtime
      .runPromise(startupProgram)
      .then((result) => {
        console.log('Startup completed:', result);
        if (result.dbWasInitialized) {
          console.log('Database was initialized from scratch');
        } else {
          console.log('Database was already present and functional');
        }
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
            Loading project and checking database...
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
