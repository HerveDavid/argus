import React from 'react';
import {
  MetadataProvider,
  ScadaSubscriptionStatus,
  ScadaOutputsList,
  ScadaMessagesList,
} from './metadata-provider';

interface SingleLineDiagramProps {
  id: string;
  className?: string;
  autoSubscribe?: boolean;
  showDebugInfo?: boolean;
}

export const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  id,
  className,
  autoSubscribe = true,
  showDebugInfo = true,
}) => {
  return (
    <MetadataProvider elementId={id} autoSubscribe={autoSubscribe}>
      <div className={className}>
        {/* Votre contenu de diagramme */}
        <div>Diagramme SLD pour: {id}</div>

        {/* Informations de debug si activées */}
        {showDebugInfo && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <ScadaSubscriptionStatus />
            <ScadaOutputsList />
            <ScadaMessagesList />
          </div>
        )}
      </div>
    </MetadataProvider>
  );
};

// Exemple d'utilisation avancée avec contrôle manuel
export const AdvancedSingleLineDiagram: React.FC<{ id: string }> = ({ id }) => {
  return (
    <MetadataProvider elementId={id} autoSubscribe={false}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Diagramme {id}</h2>

        {/* Status et contrôles */}
        <ScadaSubscriptionStatus />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Liste des outputs */}
          <div>
            <ScadaOutputsList />
          </div>

          {/* Messages */}
          <div>
            <ScadaMessagesList />
          </div>
        </div>
      </div>
    </MetadataProvider>
  );
};
