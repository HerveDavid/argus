import { useAtomSet } from '@effect-atom/atom-react';
import { Exit } from 'effect';
import React, { createContext } from 'react';

import { useMetadata } from './metadata.provider';
import { useDiagram } from './diagram.provider';
import { updateFeedersBatch } from '../utils/update-feeder';
import { DiagramEvent } from '@/types/diagram-event';
import { Channel } from '@tauri-apps/api/core';
import {
  addChannelFeeders,
  removeChannelFeeders,
} from '../services/metadata.service';

type FeedersContextType = {
  channel: React.RefObject<Channel<DiagramEvent> | null>;
};

const FeedersContext = createContext<FeedersContextType | undefined>(undefined);

export const useFeeders = () => {
  const context = React.useContext(FeedersContext);
  if (!context) {
    throw new Error('useFeeders must be used within FeedersProvider');
  }
  return context;
};

// Custom hook pour gérer le channel et sa subscription avec protection anti-stale
const useChannelSubscription = (
  elementId: string,
  isInitialized: boolean,
  svgRef: any,
) => {
  const [channel, setChannel] = React.useState<Channel<DiagramEvent> | null>(
    null,
  );

  // Créer le channel quand nécessaire avec callback qui évite les stale refs
  React.useEffect(() => {
    if (isInitialized) {
      const newChannel = new Channel<DiagramEvent>((event) => {
        console.log('Channel event received:', event, 'elementId:', elementId);

        if (event.tag === 'FeederUpdate') {
          // 🛡️ PROTECTION ANTI-STALE 1: Vérifier que svgRef existe
          if (!svgRef.current) {
            console.warn(
              '⚠️ SVG ref is null, skipping update for elementId:',
              elementId,
            );
            return;
          }

          // 🛡️ PROTECTION ANTI-STALE 2: Vérifier que l'élément est encore dans le DOM
          if (!document.contains(svgRef.current)) {
            console.warn(
              '⚠️ SVG element not in DOM (stale reference), skipping update for elementId:',
              elementId,
            );
            return;
          }

          // 🛡️ PROTECTION ANTI-STALE 3: Vérifier que l'élément est visible
          const rect = svgRef.current.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            console.warn(
              '⚠️ SVG has zero dimensions (possibly hidden by dockview), skipping update for elementId:',
              elementId,
            );
            return;
          }

          console.log(
            '✅ SVG is valid, proceeding with update for elementId:',
            elementId,
          );

          try {
            updateFeedersBatch(svgRef, event.content.feeders);
          } catch (error) {
            console.error(
              '💥 Error updating feeders for elementId:',
              elementId,
              error,
            );
          }
        }
      });

      setChannel(newChannel);
      console.log('Channel created for elementId:', elementId);

      return () => {
        console.log('Cleaning up channel for elementId:', elementId);
        setChannel(null);
      };
    }
  }, [elementId, isInitialized]); // ⚠️ Ne pas mettre svgRef dans les deps pour éviter les recréations inutiles

  return channel;
};

// Custom hook pour gérer les opérations atom avec le channel
const useChannelOperations = (
  elementId: string,
  channel: Channel<DiagramEvent> | null,
) => {
  // Toujours créer les atoms, mais avec des valeurs par défaut
  const addChannelAtom = React.useMemo(() => {
    if (channel) {
      return addChannelFeeders({
        elementId,
        channel,
      });
    }
    // Retourner un atom family avec un channel dummy pour éviter null
    return addChannelFeeders({
      elementId,
      channel: new Channel(() => {}), // Channel dummy
    });
  }, [elementId, channel]);

  const removeChannelAtom = React.useMemo(() => {
    return removeChannelFeeders({
      elementId,
    });
  }, [elementId]);

  const addChannel = useAtomSet(addChannelAtom, { mode: 'promiseExit' });

  const removeChannel = useAtomSet(removeChannelAtom, { mode: 'promiseExit' });

  return {
    addChannel,
    removeChannel,
    canAdd: !!channel, // Seule cette valeur indique si on peut vraiment ajouter
  };
};

export const FeedersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { elementId } = useMetadata();
  const { svgRef, isInitialized } = useDiagram();

  // Utiliser le custom hook pour le channel
  const channel = useChannelSubscription(elementId, isInitialized, svgRef);
  const channelRef = React.useRef<Channel<DiagramEvent> | null>(null);

  // État pour tracker si le channel est actif
  const [isChannelActive, setIsChannelActive] = React.useState(false);

  // Mettre à jour la ref quand le channel change
  React.useEffect(() => {
    channelRef.current = channel;
    // Reset l'état actif quand le channel change
    if (channel !== channelRef.current) {
      setIsChannelActive(false);
    }
  }, [channel]);

  // Obtenir les opérations atom
  const { addChannel, removeChannel, canAdd } = useChannelOperations(
    elementId,
    channel,
  );

  // Effet pour gérer l'ajout/suppression du channel avec protection contre les doubles ajouts
  React.useEffect(() => {
    if (!channel || !isInitialized || !canAdd || isChannelActive) {
      return; // Ne rien faire si déjà actif ou conditions non remplies
    }

    let cancelled = false;

    console.log('🚀 About to add channel for elementId:', elementId);

    addChannel()
      .then((exit) => {
        if (cancelled) return;

        console.log('📥 AddChannel result for elementId:', elementId, exit);
        if (Exit.isSuccess(exit)) {
          console.log(
            '✅ Channel added successfully for elementId:',
            elementId,
            exit.value,
          );
          setIsChannelActive(true);
        } else {
          console.error(
            '❌ Error adding channel for elementId:',
            elementId,
            exit.toJSON(),
          );
          console.error('Error details:', exit.cause);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('💥 Promise rejected for elementId:', elementId, error);
        }
      });

    return () => {
      cancelled = true;

      // Seulement supprimer si le channel était actif
      if (isChannelActive) {
        console.log('🧹 Cleaning up channel for elementId:', elementId);

        removeChannel()
          .then((exit) => {
            console.log('📤 Channel removed for elementId:', elementId, exit);
          })
          .catch((error) => {
            console.error(
              '💥 Error removing channel for elementId:',
              elementId,
              error,
            );
          })
          .finally(() => {
            setIsChannelActive(false);
          });
      }
    };
  }, [
    channel,
    elementId,
    isInitialized,
    addChannel,
    removeChannel,
    canAdd,
    isChannelActive,
  ]);

  // 🔄 Effet pour forcer la reconnexion quand dockview réorganise les panneaux
  React.useEffect(() => {
    if (!svgRef.current || !isChannelActive) return;

    // Vérifier périodiquement si le SVG est toujours valide
    const checkSvgValidity = () => {
      if (svgRef.current && !document.contains(svgRef.current)) {
        console.log(
          '🔄 Detected SVG removal by dockview, will trigger reconnection',
        );
        setIsChannelActive(false); // Cela va déclencher une reconnexion
      }
    };

    // Vérifier toutes les 100ms pendant les 2 premières secondes après activation
    // (période critique où dockview peut réorganiser)
    let checkCount = 0;
    const interval = setInterval(() => {
      checkSvgValidity();
      checkCount++;
      if (checkCount >= 20) {
        // Arrêter après 2 secondes
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isChannelActive, svgRef]);

  const contextValue = React.useMemo(() => ({ channel: channelRef }), []);

  return (
    <FeedersContext.Provider value={contextValue}>
      {children}
    </FeedersContext.Provider>
  );
};
