import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { createExecuteLineExtension } from '../features/execute-line';

const EXAMPLE = `set simulation duration to 10 seconds;
set time step to 1 seconds;
at 2 seconds, open switch "CB1";
when voltage at bus "Bus1" < 0.9 pu, increase load "Load1" by 10%;
after "12345" is completed, apply fault at line "Line1";`;

export const DslEditor = () => {
  const handleExecuteLine = (lineNumber: number, lineContent: string) => {
    console.log(`Executing DSL line ${lineNumber}:`, lineContent);
    try {
      alert(`Executed: ${lineContent}`);
    } catch (error) {
      console.error('Error executing line:', error);
    }
  };

  return (
    <div style={{ height: '100vh', fontFamily: 'monospace' }}>
      <CodeMirror
        value={EXAMPLE}
        height="100vh"
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
  );
};
