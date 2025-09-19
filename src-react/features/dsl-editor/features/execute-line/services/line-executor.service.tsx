// execute-line/index.ts
import { gutter, GutterMarker, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { ViewPlugin } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { ReactExecuteMarker } from './react-execute-marker';
import { ExecuteGutterPlugin } from './executer-gutter-plugin';

// Interface pour les fonctions DSL
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

export const createExecuteLineExtension = (
  dslFunctions: DslFunctions,
): Extension[] => {
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
          const marker = new ReactExecuteMarker(
            currentLineNumber,
            currentLineContent,
            dslFunctions,
          );
          builder.add(currentLine.from, currentLine.from, marker);
        }

        return builder.finish();
      },
      initialSpacer: (): GutterMarker =>
        new ReactExecuteMarker(0, '', dslFunctions),
    }),

    ViewPlugin.fromClass(ExecuteGutterPlugin),
  ];
};
