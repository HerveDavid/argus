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
import { invoke } from '@tauri-apps/api/core';

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
  const [dslContent, setDslContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Gérer le démontage proprement
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Charger le fichier DSL au montage
  useEffect(() => {
    const loadDslFile = async () => {
      if (!isMountedRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Construire le chemin complet du fichier
        const fullPath = `${file.filepath}`;

        // Appeler la fonction read_dsl depuis Rust
        const content = await invoke<string>('read_dsl_file', {
          file_path: fullPath,
        });

        if (isMountedRef.current) {
          setDslContent(content);
        }
      } catch (err) {
        console.error('Error loading DSL file:', err);
        if (isMountedRef.current) {
          setError(`Failed to load file: ${err}`);
          // Garder le contenu vide en cas d'erreur
          setDslContent('');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadDslFile();
  }, [file.filepath, file.filename]);

  // Initialiser le contenu DSL après le chargement
  useEffect(() => {
    if (
      !isInitializedRef.current &&
      !isLoading &&
      isMountedRef.current &&
      dslContent
    ) {
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
    isLoading,
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

      {/* Affichage des états de chargement et d'erreur */}
      {isLoading && (
        <div className="flex items-center justify-center bg-gray-800 p-4 text-white">
          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
          Loading DSL file...
        </div>
      )}

      {error && (
        <div className="border-l-4 border-red-500 bg-red-900 p-4 text-red-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Error loading file</p>
              <p className="mt-1 text-sm text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <CodeMirror
          className="h-full border-t"
          value={dslContent}
          height="100%"
          theme={oneDark}
          onChange={handleContentChange}
          extensions={extensions}
          basicSetup={basicSetup}
          editable={!isLoading} // Désactive l'édition pendant le chargement
        />
      </div>
    </div>
  );
};
