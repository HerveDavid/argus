import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { createExecuteLineExtension } from '../features/execute-line';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DslFile } from '@/types/dsl';
import { IDockviewPanelProps } from 'dockview';
import { Header } from './editor-header';
import { useDsl } from '../provider/dsl.provider';

const EXAMPLE = `set simulation duration to 30 seconds;
set time step to 1 seconds;
at 5 seconds, open switch "S1" tagged "event1";
at 15 seconds, close switch "S1";
at [10 seconds, 20 seconds] with law "linear", increase load "B1" by 20%;
when voltage at bus "B1" > 1.05 pu, decrease generator "G1" by 10% tagged "voltage_control";
after "event1" is completed, close switch "S2";
at 12 seconds, apply fault at line "L1";
at 18 seconds, clear fault at line "L1";
at 3 seconds, increase load ["B2", "B3", "B4"] by 15%;
at 25 seconds, decrease generator cluster "GenCluster" ["G2", "G3"] by 5%;
when (voltage at bus "B2" < 0.95 pu and frequency at bus "B2" > 50.1 Hz), increase load "B2" by 5%;
at [7 seconds, 14 seconds] with law "step", decrease load "B3" by 10%;
after "voltage_control" is completed, open switch "S3";
`;

type DslEditorProps = {
  file: DslFile;
};

export const DslEditor: React.FC<IDockviewPanelProps<DslEditorProps>> = ({
  params: { file },
}) => {
  const {
    updateInitScenarioRequest,
    setInitScenarioRequest,
    setCurrentFileName,
  } = useDsl();
  const [dslContent, setDslContent] = useState(EXAMPLE);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Gérer le démontage proprement
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialiser le contenu DSL au montage du composant
  useEffect(() => {
    if (!isInitializedRef.current && isMountedRef.current) {
      const dslContentBytes = new TextEncoder().encode(dslContent);

      // Définir le nom du fichier actuel
      setCurrentFileName(file.filepath.toString());

      setInitScenarioRequest({
        dsl_file_content: Array.from(dslContentBytes),
        simulation_name: file.filename.toString(),
        artifact_id: 'ieee14bus',
      });

      isInitializedRef.current = true;
    }
  }, [
    file.filepath,
    file.filename,
    dslContent,
    setInitScenarioRequest,
    setCurrentFileName,
  ]);

  // Handler pour l'exécution de ligne avec gestion d'erreur
  const handleExecuteLine = useCallback(
    (lineNumber: number, lineContent: string) => {
      // Vérifier si le composant est toujours monté
      if (!isMountedRef.current) {
        return;
      }

      console.log(`Executing DSL line ${lineNumber}:`, lineContent);

      // Utiliser setTimeout pour éviter les problèmes de race condition
      setTimeout(() => {
        if (isMountedRef.current) {
          try {
            alert(`Executed: ${lineContent}`);
          } catch (error) {
            console.error('Error executing line:', error);
          }
        }
      }, 0);
    },
    [],
  );

  // Handler pour le changement de contenu avec debounce amélioré
  const handleContentChange = useCallback(
    (value: string) => {
      if (!isMountedRef.current) {
        return;
      }

      setDslContent(value);

      // Utiliser setTimeout pour éviter les mises à jour synchrones
      setTimeout(() => {
        if (isMountedRef.current) {
          const dslContentBytes = new TextEncoder().encode(value);

          // Utiliser updateInitScenarioRequest pour les modifications (avec debounce)
          updateInitScenarioRequest({
            dsl_file_content: Array.from(dslContentBytes),
            simulation_name: file.filename.toString(),
            artifact_id: 'ieee14bus',
          });
        }
      }, 0);
    },
    [updateInitScenarioRequest, file.filename],
  );

  // Mémoriser les extensions pour éviter la recréation
  const extensions = React.useMemo(() => {
    try {
      return [
        javascript(),
        ...createExecuteLineExtension(handleExecuteLine),
        EditorView.lineWrapping,
      ];
    } catch (error) {
      console.error('Error creating extensions:', error);
      // Fallback sans l'extension d'exécution en cas d'erreur
      return [javascript(), EditorView.lineWrapping];
    }
  }, [handleExecuteLine]);

  // Configuration básica memoizada
  const basicSetup = React.useMemo(
    () => ({
      lineNumbers: true,
      foldGutter: true,
      dropCursor: false,
      allowMultipleSelections: false,
      indentOnInput: true,
      bracketMatching: true,
      closeBrackets: true,
      autocompletion: true,
      highlightSelectionMatches: false,
    }),
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <Header filepath={file.filepath} />
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          className="h-full border-t"
          value={dslContent}
          height="100%"
          theme={oneDark}
          onChange={handleContentChange}
          extensions={extensions}
          basicSetup={basicSetup}
        />
      </div>
    </div>
  );
};
