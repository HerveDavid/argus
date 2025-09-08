import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { createExecuteLineExtension } from '../features/execute-line';
import React from 'react';
import { DslFile } from '@/types/dsl';
import { IDockviewPanelProps } from 'dockview';
import { Header } from './editor-header';
import { Footer } from './editor-footer';

const EXAMPLE = `set simulation duration to 10 seconds;
set time step to 1 seconds;
at 2 seconds, open switch "CB1";
when voltage at bus "Bus1" < 0.9 pu, increase load "Load1" by 10%;
after "12345" is completed, apply fault at line "Line1";`;

type DslEditorProps = {
  file: DslFile;
};

export const DslEditor: React.FC<IDockviewPanelProps<DslEditorProps>> = ({
  params: { file },
}) => {
  const handleExecuteLine = (lineNumber: number, lineContent: string) => {
    console.log(`Executing DSL line ${lineNumber}:`, lineContent);
    try {
      alert(`Executed: ${lineContent}`);
    } catch (error) {
      console.error('Error executing line:', error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <Header filepath={file.filepath} />
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          className="h-full border-t"
          value={EXAMPLE}
          height="100%"
          theme={oneDark}
          extensions={[
            javascript(),
            ...createExecuteLineExtension(handleExecuteLine),
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
    </div>
  );
};
