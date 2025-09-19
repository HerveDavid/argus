import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SimulationConfig,
  DslEditorError,
  useDslEditor,
} from '@/features/dsl-editor/provider/dsl-editor.provider';
import { useState } from 'react';

export const LoadButton = () => {
  const [simulationConfig, setSimulationConfig] =
    useState<SimulationConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const { initDslFile, isLoading, dslState } = useDslEditor();

  const handleUpload = async () => {
    // Reset les états précédents
    setError(null);
    setSimulationConfig(null);
    setIsInitializing(true);

    try {
      // Vérification préalable optionnelle
      if (dslState.dsl_file_content.length === 0) {
        throw new Error(
          "Aucun fichier DSL chargé. Veuillez d'abord charger un fichier.",
        );
      }

      const config = await initDslFile();
      setSimulationConfig(config);

      console.log('Simulation initialisée avec succès:', config);

      // Optionnel : afficher un message de succès temporaire
      // setTimeout(() => setSimulationConfig(null), 5000);
    } catch (err) {
      console.error("Erreur lors de l'initialisation:", err);

      if (err instanceof DslEditorError) {
        // Gestion spécifique des erreurs DSL
        setError(`[${err.code}] ${err.message}`);
      } else if (err instanceof Error) {
        // Gestion des erreurs génériques
        setError(err.message);
      } else {
        // Fallback pour les erreurs inconnues
        setError("Une erreur inattendue s'est produite");
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const buttonDisabled =
    isLoading || isInitializing || dslState.dsl_file_content.length === 0;

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={handleUpload}
        disabled={buttonDisabled}
        title={
          dslState.dsl_file_content.length === 0
            ? 'Aucun fichier DSL chargé'
            : 'Initialiser le scénario DSL'
        }
      >
        <Upload size={16} />
      </Button>

      {/* Affichage des erreurs */}
      {error && (
        <div className="max-w-xs text-xs break-words text-red-600">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Affichage du succès (optionnel) */}
      {simulationConfig && (
        <div className="max-w-xs text-xs text-green-600">
          <strong>Succès:</strong> Simulation "{simulationConfig.simulationName}
          " initialisée
        </div>
      )}

      {/* Indicateur de chargement */}
      {(isLoading || isInitializing) && (
        <div className="text-xs text-blue-600">Initialisation en cours...</div>
      )}
    </div>
  );
};
