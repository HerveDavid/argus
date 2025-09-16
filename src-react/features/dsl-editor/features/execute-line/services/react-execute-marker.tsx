// react-execute-marker.tsx
import { GutterMarker } from '@codemirror/view';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { ExecuteCallback } from '../types';
import { Button } from '@/components/ui/button';
import { BugPlay } from 'lucide-react';

// Composant React pour le bouton d'exécution
const ExecuteButton: React.FC<{
  lineNumber: number;
  lineContent: string;
  onExecute?: ExecuteCallback;
}> = ({ lineNumber, lineContent, onExecute }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onExecute && lineContent.trim()) {
      try {
        onExecute(lineNumber, lineContent);
      } catch (error) {
        console.error('Error executing line:', error);
      }
    }
  };

  if (!lineContent.trim() || lineNumber === 0) {
    return null;
  }

  return (
    <button
      className="cm-execute-button mr-4"
      onClick={handleClick}
      title={`Execute line ${lineNumber}: ${lineContent}`}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '25px',
        height: '25px',
        borderRadius: '3px',
        color: '#4ade80',
        fontSize: '12px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <BugPlay />▶
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
    private onExecute?: ExecuteCallback,
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

      // Render le composant React
      this.root.render(
        <ExecuteButton
          lineNumber={this.lineNumber}
          lineContent={this.lineContent}
          onExecute={this.onExecute}
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
