// metadata-provider.tsx (version mise à jour)
import React, { createContext, useContext } from 'react';
import { Effect } from 'effect';
import { Result, useRxValue } from '@effect-rx/rx-react';
import { PowsyblClient } from '@/services/common/powsybl-client';
import { SldMetadata } from '@/types/sld-metadata';
import { ScadaOutput } from '@/services/common/scada-client';
import { ScadaMessage } from '@/types/tstm';
import { useScadaSubscription } from './use-scada-subscription';
import { rxRuntime } from './runtime';

interface MetadataContextValue {
  // Métadonnées du diagramme
  isLoadingMetadata: boolean;
  metadata?: SldMetadata;
  metadataError?: string;

  // Subscription SCADA
  isSubscribed: boolean;
  isLoadingSubscription: boolean;
  scadaOutputs: ScadaOutput[];
  messages: ScadaMessage[];
  subscriptionError?: string;

  // Actions
  subscribe: () => void;
  unsubscribe: () => void;
  pauseTask: (taskId: string) => void;
  resumeTask: (taskId: string) => void;
  clearMessages: () => void;
}

const MetadataContext = createContext<MetadataContextValue | null>(null);

interface MetadataProviderProps {
  children: React.ReactNode;
  elementId: string;
  autoSubscribe?: boolean;
  maxMessages?: number;
}

const createDiagramRx = (elementId: string) =>
  rxRuntime.rx(
    Effect.gen(function* () {
      const powsyblClient = yield* PowsyblClient;
      return yield* powsyblClient.getSingleLineDiagram({
        element_id: elementId,
      });
    }),
  );

export const MetadataProvider: React.FC<MetadataProviderProps> = ({
  children,
  elementId,
  autoSubscribe = true,
  maxMessages = 1000,
}) => {
  // Récupération des métadonnées du diagramme
  const diagramRx = React.useMemo(() => {
    return createDiagramRx(elementId);
  }, [elementId]);

  const diagramResult = useRxValue(diagramRx);

  // Extraction des métadonnées
  const metadata = React.useMemo(() => {
    return Result.match(diagramResult, {
      onSuccess: (data) => {
        const responseData = data.value || data;
        return responseData?.metadata?.metadata || null;
      },
      onFailure: () => null,
      onInitial: () => null,
    });
  }, [diagramResult]);

  // Hook de subscription SCADA
  const subscription = useScadaSubscription({
    metadata: metadata || undefined,
    autoSubscribe,
    maxMessages,
  });

  // État des métadonnées
  const metadataState = React.useMemo(() => {
    return Result.match(diagramResult, {
      onSuccess: () => ({
        isLoadingMetadata: false,
        metadataError: undefined,
      }),
      onFailure: (err) => ({
        isLoadingMetadata: false,
        metadataError: String(err),
      }),
      onInitial: () => ({
        isLoadingMetadata: true,
        metadataError: undefined,
      }),
    });
  }, [diagramResult]);

  // Valeur du contexte
  const contextValue: MetadataContextValue = React.useMemo(() => {
    return {
      // Métadonnées
      ...metadataState,
      metadata: metadata || undefined,

      // Subscription
      isSubscribed: subscription.isSubscribed,
      isLoadingSubscription: subscription.isLoading,
      scadaOutputs: subscription.outputs,
      messages: subscription.messages,
      subscriptionError: subscription.error,

      // Actions
      subscribe: subscription.subscribe,
      unsubscribe: subscription.unsubscribe,
      pauseTask: subscription.pauseTask,
      resumeTask: subscription.resumeTask,
      clearMessages: subscription.clearMessages,
    };
  }, [metadataState, metadata, subscription]);

  return (
    <MetadataContext.Provider value={contextValue}>
      {children}
    </MetadataContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useMetadata = () => {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error('useMetadata must be used within a MetadataProvider');
  }
  return context;
};

// Components d'exemple d'utilisation
export const ScadaSubscriptionStatus: React.FC = () => {
  const {
    isLoadingMetadata,
    isLoadingSubscription,
    isSubscribed,
    scadaOutputs,
    messages,
    metadataError,
    subscriptionError,
    subscribe,
    unsubscribe,
    clearMessages,
  } = useMetadata();

  if (isLoadingMetadata) {
    return <div>Chargement des métadonnées...</div>;
  }

  if (metadataError) {
    return <div>Erreur métadonnées: {metadataError}</div>;
  }

  if (subscriptionError) {
    return <div>Erreur subscription: {subscriptionError}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span>Status: {isSubscribed ? 'Connecté' : 'Déconnecté'}</span>
        {isLoadingSubscription && <span>Connexion...</span>}

        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoadingSubscription}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isSubscribed ? 'Se déconnecter' : 'Se connecter'}
        </button>
      </div>

      {isSubscribed && (
        <div>
          <p>Outputs connectés: {scadaOutputs.length}</p>
          <p>Messages reçus: {messages.length}</p>

          <button
            onClick={clearMessages}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Vider les messages
          </button>
        </div>
      )}
    </div>
  );
};

export const ScadaOutputsList: React.FC = () => {
  const { scadaOutputs, pauseTask, resumeTask } = useMetadata();

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">SCADA Outputs:</h3>
      {scadaOutputs.map((output) => (
        <div
          key={output.id}
          className="flex items-center justify-between p-2 border rounded"
        >
          <div>
            <span className="font-mono text-sm">{output.id}</span>
            <span className="ml-2 text-gray-600">{output.graphical_id}</span>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => pauseTask(output.id)}
              className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
            >
              Pause
            </button>
            <button
              onClick={() => resumeTask(output.id)}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs"
            >
              Resume
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ScadaMessagesList: React.FC = () => {
  const { messages } = useMetadata();

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Messages SCADA:</h3>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {messages.map((message, index) => (
          <div
            key={index}
            className="p-2 bg-gray-100 rounded text-sm font-mono"
          >
            {JSON.stringify(message, null, 2)}
          </div>
        ))}
      </div>
    </div>
  );
};
