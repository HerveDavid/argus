import { gutter, GutterMarker, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { ViewPlugin } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { ReactExecuteMarker } from './react-execute-marker';
import { ExecuteGutterPlugin } from './executer-gutter-plugin';
import { ExecuteCallback } from '../types';

export const executeLineExtension: Extension[] = [
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
        );
        builder.add(currentLine.from, currentLine.from, marker);
      }

      return builder.finish();
    },
    initialSpacer: (): GutterMarker => new ReactExecuteMarker(0, ''),
  }),

  ViewPlugin.fromClass(ExecuteGutterPlugin),
];

export const createExecuteLineExtension = (
  onExecute?: ExecuteCallback,
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
            onExecute,
          );
          builder.add(currentLine.from, currentLine.from, marker);
        }

        return builder.finish();
      },
      initialSpacer: (): GutterMarker =>
        new ReactExecuteMarker(0, '', onExecute),
    }),

    ViewPlugin.fromClass(ExecuteGutterPlugin),
  ];
};
