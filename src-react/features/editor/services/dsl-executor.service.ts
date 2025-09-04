import { gutter, GutterMarker, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { ViewPlugin, ViewUpdate, PluginValue } from '@codemirror/view';
import { Extension } from '@codemirror/state';

class ExecuteMarker extends GutterMarker {
  constructor(
    private lineNumber: number, 
    private lineContent: string
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const button = document.createElement('button');
    button.textContent = '▶';
    button.className = 'execute-btn';
    button.style.cssText = `
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 10px;
      cursor: pointer;
      margin-left: 4px;
    `;

    // Afficher le contenu de la ligne dans le tooltip au lieu du numéro
    const truncatedContent: string =
      this.lineContent.length > 50
        ? this.lineContent.substring(0, 50) + '...'
        : this.lineContent;
    button.title = `Execute: ${truncatedContent}`;

    button.addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Executing line ${this.lineNumber}: "${this.lineContent}"`);

      // Ici vous pouvez traiter le contenu de la ligne
      // Par exemple, l'envoyer à un parseur ou exécuter la commande
    });

    return button;
  }
}

// Plugin class pour gérer les mises à jour
class ExecuteGutterPlugin implements PluginValue {
  constructor(view: EditorView) {}

  update(update: ViewUpdate): void {
    if (update.selectionSet) {
      // Force la mise à jour du gutter quand la sélection change
      update.view.requestMeasure();
    }
  }

  destroy(): void {
    // Cleanup si nécessaire
  }
}

// Extension qui ajoute les boutons execute seulement sur la ligne courante
export const executeGutterExtension: Extension[] = [
  gutter({
    class: 'cm-execute-gutter',
    side: 'after',
    markers: (view: EditorView) => {
      const builder = new RangeSetBuilder<GutterMarker>();
      const doc = view.state.doc;
      const selection = view.state.selection.main;
      const currentLine = doc.lineAt(selection.head);
      const currentLineNumber: number = currentLine.number;
      const currentLineContent: string = currentLine.text.trim();

      // Ajouter un marqueur seulement pour la ligne courante si elle n'est pas vide
      if (currentLineContent.length > 0) {
        builder.add(
          currentLine.from,
          currentLine.from,
          new ExecuteMarker(currentLineNumber, currentLineContent),
        );
      }

      return builder.finish();
    },
    initialSpacer: (): GutterMarker => new ExecuteMarker(0, ''),
  }),

  // Plugin pour forcer la mise à jour du gutter quand le curseur bouge
  ViewPlugin.fromClass(ExecuteGutterPlugin),
];

// Types optionnels pour une meilleure intégration
export interface ExecuteCallback {
  (lineNumber: number, lineContent: string): void;
}

// Version avec callback personnalisable
export const createExecuteGutterExtension = (
  onExecute?: ExecuteCallback
): Extension[] => {
  class CustomExecuteMarker extends GutterMarker {
    constructor(
      private lineNumber: number, 
      private lineContent: string,
      private executeCallback?: ExecuteCallback
    ) {
      super();
    }

    toDOM(): HTMLElement {
      const button = document.createElement('button');
      button.textContent = '▶';
      button.className = 'execute-btn';
      button.style.cssText = `
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 10px;
        cursor: pointer;
        margin-left: 4px;
      `;

      const truncatedContent: string =
        this.lineContent.length > 50
          ? this.lineContent.substring(0, 50) + '...'
          : this.lineContent;
      button.title = `Execute: ${truncatedContent}`;

      button.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.executeCallback) {
          this.executeCallback(this.lineNumber, this.lineContent);
        } else {
          console.log(`Executing line ${this.lineNumber}: "${this.lineContent}"`);
        }
      });

      return button;
    }
  }

  return [
    gutter({
      class: 'cm-execute-gutter',
      side: 'after',
      markers: (view: EditorView) => {
        const builder = new RangeSetBuilder<GutterMarker>();
        const doc = view.state.doc;
        const selection = view.state.selection.main;
        const currentLine = doc.lineAt(selection.head);
        const currentLineNumber: number = currentLine.number;
        const currentLineContent: string = currentLine.text.trim();

        if (currentLineContent.length > 0) {
          builder.add(
            currentLine.from,
            currentLine.from,
            new CustomExecuteMarker(currentLineNumber, currentLineContent, onExecute),
          );
        }

        return builder.finish();
      },
      initialSpacer: (): GutterMarker => new CustomExecuteMarker(0, '', onExecute),
    }),

    ViewPlugin.fromClass(ExecuteGutterPlugin),
  ];
};