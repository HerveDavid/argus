import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@uiw/react-codemirror';
import { EditorView, gutter, GutterMarker } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { ViewPlugin, ViewUpdate } from '@codemirror/view';

const EXAMPLE = `set simulation duration to 10 seconds;
set time step to 1 seconds;
at 2 seconds, open switch "CB1";
when voltage at bus "Bus1" < 0.9 pu, increase load "Load1" by 10%;
after "12345" is completed, apply fault at line "Line1";`;

// Marqueur pour le bouton execute
class ExecuteMarker extends GutterMarker {
  constructor(lineNumber, lineContent) {
    super();
    this.lineNumber = lineNumber;
    this.lineContent = lineContent;
  }

  toDOM() {
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
    const truncatedContent =
      this.lineContent.length > 50
        ? this.lineContent.substring(0, 50) + '...'
        : this.lineContent;
    button.title = `Execute: ${truncatedContent}`;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Executing line ${this.lineNumber}: "${this.lineContent}"`);

      // Ici vous pouvez traiter le contenu de la ligne
      // Par exemple, l'envoyer à un parseur ou exécuter la commande
    });

    return button;
  }
}

// Extension qui ajoute les boutons execute seulement sur la ligne courante
const executeGutterExtension = [
  gutter({
    class: 'cm-execute-gutter',
    side: 'after',
    markers: (view) => {
      const builder = new RangeSetBuilder();
      const doc = view.state.doc;
      const selection = view.state.selection.main;
      const currentLine = doc.lineAt(selection.head);
      const currentLineNumber = currentLine.number;
      const currentLineContent = currentLine.text.trim();

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
    initialSpacer: () => new ExecuteMarker(0, ''),
  }),

  // Plugin pour forcer la mise à jour du gutter quand le curseur bouge
  ViewPlugin.fromClass(
    class {
      update(update) {
        if (update.selectionSet) {
          // Force la mise à jour du gutter quand la sélection change
          update.view.requestMeasure();
        }
      }
    },
  ),
];

export const DslEditor = () => {
  return (
    <div style={{ height: '100vh', fontFamily: 'monospace' }}>
      <CodeMirror
        value={EXAMPLE}
        height="100vh"
        theme={oneDark}
        extensions={[
          javascript(),
          executeGutterExtension,
          EditorView.lineWrapping,
        ]}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
        }}
      />
    </div>
  );
};
