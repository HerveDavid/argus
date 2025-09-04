import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { executeGutterExtension } from '../services/dsl-executor.service';

const EXAMPLE = `set simulation duration to 10 seconds;
set time step to 1 seconds;
at 2 seconds, open switch "CB1";
when voltage at bus "Bus1" < 0.9 pu, increase load "Load1" by 10%;
after "12345" is completed, apply fault at line "Line1";`;

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
