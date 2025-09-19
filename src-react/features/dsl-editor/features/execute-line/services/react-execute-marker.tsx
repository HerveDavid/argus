// react-execute-marker.tsx
import { GutterMarker } from '@codemirror/view';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { BugPlay } from 'lucide-react';
import { toast } from 'sonner';

// Interface pour les fonctions DSL injectées
interface DslFunctions {
  nextStepDsl: (
    dsl: string,
  ) => Promise<{
    message: string;
    simulationName: string;
    target_time: number;
  } | null>;
  isNextStepping: boolean;
  canExecuteNextStep: boolean;
}

// Composant React pour le bouton d'exécution - maintenant sans hook
const ExecuteButton: React.FC<{
  lineNumber: number;
  lineContent: string;
  dslFunctions: DslFunctions;
}> = ({ lineNumber, lineContent, dslFunctions }) => {
  const { nextStepDsl, isNextStepping, canExecuteNextStep } = dslFunctions;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canExecuteNextStep) {
      toast.error("Impossible d'exécuter la ligne", {
        description: 'La simulation doit être prête et en cours de démarrage',
      });
      return;
    }

    if (!lineContent.trim()) {
      toast.warning('Ligne vide', {
        description: "Impossible d'exécuter une ligne vide",
      });
      return;
    }

    try {
      // Toast de début d'exécution
      toast.loading(`Exécution de la ligne ${lineNumber}...`, {
        id: `execute-${lineNumber}`,
        description:
          lineContent.length > 50
            ? lineContent.substring(0, 50) + '...'
            : lineContent,
      });

      const result = await nextStepDsl(lineContent);

      if (result) {
        // Toast de succès
        toast.success('Ligne exécutée avec succès', {
          id: `execute-${lineNumber}`,
          description: `${result.message} - Target time: ${result.target_time}`,
          duration: 3000,
        });
      } else {
        // En cas d'échec mais sans exception
        toast.error("Échec de l'exécution", {
          id: `execute-${lineNumber}`,
          description: "La ligne n'a pas pu être exécutée",
        });
      }
    } catch (error) {
      // Toast d'erreur
      toast.error("Erreur lors de l'exécution", {
        id: `execute-${lineNumber}`,
        description:
          error instanceof Error
            ? error.message
            : "Une erreur inconnue s'est produite",
      });
    }
  };

  if (!lineContent.trim() || lineNumber === 0) {
    return null;
  }

  return (
    <button
      className="cm-execute-button mr-4"
      onClick={handleClick}
      disabled={!canExecuteNextStep || isNextStepping}
      title={`Execute line ${lineNumber}: ${lineContent}`}
      style={{
        background: 'transparent',
        border: 'none',
        cursor:
          !canExecuteNextStep || isNextStepping ? 'not-allowed' : 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '25px',
        height: '25px',
        borderRadius: '3px',
        color: !canExecuteNextStep || isNextStepping ? '#6b7280' : '#4ade80',
        fontSize: '12px',
        opacity: !canExecuteNextStep || isNextStepping ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!(!canExecuteNextStep || isNextStepping)) {
          e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <BugPlay />
      {isNextStepping ? '⏳' : '▶'}
    </button>
  );
};

export class ReactExecuteMarker extends GutterMarker {
  private root: Root | null = null;
  private element: HTMLElement | null = null;
  private isDestroyed = false;
  private destroyTimeout: NodeJS.Timeout | null = null;

  constructor(
    private lineNumber: number,
    private lineContent: string,
    private dslFunctions: DslFunctions,
  ) {
    super();
  }

  eq(other: ReactExecuteMarker): boolean {
    return (
      this.lineNumber === other.lineNumber &&
      this.lineContent === other.lineContent
    );
  }

  toDOM(): HTMLElement {
    if (this.isDestroyed) {
      console.warn('Attempting to create DOM for destroyed marker');
      return document.createElement('div');
    }

    try {
      this.element = document.createElement('div');
      this.element.className = 'cm-execute-marker';

      // Créer le root React
      this.root = createRoot(this.element);

      // Render le composant React avec les fonctions DSL injectées
      this.root.render(
        <ExecuteButton
          lineNumber={this.lineNumber}
          lineContent={this.lineContent}
          dslFunctions={this.dslFunctions}
        />,
      );

      return this.element;
    } catch (error) {
      console.error('Error creating ReactExecuteMarker DOM:', error);
      // Fallback vers un élément vide en cas d'erreur
      return document.createElement('div');
    }
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    // Annuler tout timeout de destruction en cours
    if (this.destroyTimeout) {
      clearTimeout(this.destroyTimeout);
      this.destroyTimeout = null;
    }

    // Programmer la destruction asynchrone pour éviter les race conditions
    this.destroyTimeout = setTimeout(() => {
      try {
        if (this.root) {
          // Utiliser une approche défensive pour le démontage
          const rootToUnmount = this.root;
          this.root = null;

          // Démonter de manière asynchrone
          requestAnimationFrame(() => {
            try {
              rootToUnmount.unmount();
            } catch (error) {
              console.warn('Error unmounting React root:', error);
            }
          });
        }

        // Nettoyer l'élément DOM
        if (this.element && this.element.parentNode) {
          try {
            this.element.parentNode.removeChild(this.element);
          } catch (error) {
            console.warn('Error removing element from DOM:', error);
          }
        }

        this.element = null;
        this.destroyTimeout = null;
      } catch (error) {
        console.error('Error in ReactExecuteMarker destroy:', error);
        this.destroyTimeout = null;
      }
    }, 0);
  }

  // Méthode de nettoyage forcé en cas d'urgence
  forceCleanup(): void {
    if (this.destroyTimeout) {
      clearTimeout(this.destroyTimeout);
      this.destroyTimeout = null;
    }

    try {
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }
      if (this.element?.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    } catch (error) {
      console.warn('Error in force cleanup:', error);
    }

    this.isDestroyed = true;
  }
}
