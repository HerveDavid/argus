import { createMachine, assign, fromPromise } from 'xstate';

import { DiagramData, NodeData, LinkData } from '../types';

export interface GrafcetContext {
  diagramData: DiagramData;
  selectedNodeKey: number | null;
  selectedLinkKey: number | null;
  isModified: boolean;
  error: string | null;
  currentTool: 'select' | 'addNode' | 'addLink' | 'delete';
  clipboard: {
    nodes: NodeData[];
    links: LinkData[];
  };
  undoStack: DiagramData[];
  redoStack: DiagramData[];
  fileOperations: {
    isImporting: boolean;
    isExporting: boolean;
  };
}

const initialDiagramData: DiagramData = {
  nodeDataArray: [],
  linkDataArray: [],
  modelData: { canRelink: true },
  skipsDiagramUpdate: false,
};

export const grafcetMachine = createMachine(
  {
    id: 'grafcet',
    initial: 'idle',
    context: {
      diagramData: initialDiagramData,
      selectedNodeKey: null,
      selectedLinkKey: null,
      isModified: false,
      error: null,
      currentTool: 'select',
      clipboard: { nodes: [], links: [] },
      undoStack: [],
      redoStack: [],
      fileOperations: {
        isImporting: false,
        isExporting: false,
      },
    } as GrafcetContext,

    states: {
      idle: {
        on: {
          DIAGRAM_LOADED: {
            target: 'ready',
            actions: ['setDiagramData', 'clearHistory'],
          },
          IMPORT_FILE: {
            target: 'importing',
            actions: ['setImportingFlag'],
          },
          RESET_TO_EXAMPLE: {
            target: 'ready',
            actions: ['loadExampleData', 'clearHistory'],
          },
          CLEAR_DIAGRAM: {
            target: 'ready',
            actions: ['clearDiagram', 'clearHistory'],
          },
        },
      },

      ready: {
        initial: 'selecting',

        states: {
          selecting: {
            on: {
              NODE_SELECTED: {
                actions: ['selectNode'],
              },
              LINK_SELECTED: {
                actions: ['selectLink'],
              },
              NODE_DESELECTED: {
                actions: ['deselectNode'],
              },
              LINK_DESELECTED: {
                actions: ['deselectLink'],
              },
              TOOL_SELECTED: {
                target: 'toolSelected',
                actions: ['setCurrentTool'],
              },
            },
          },

          toolSelected: {
            on: {
              NODE_ADDED: {
                target: 'editing',
                actions: ['addNode', 'saveToUndoStack', 'markAsModified'],
              },
              LINK_ADDED: {
                target: 'editing',
                actions: ['addLink', 'saveToUndoStack', 'markAsModified'],
              },
              TOOL_SELECTED: {
                actions: ['setCurrentTool'],
              },
            },
          },

          editing: {
            on: {
              NODE_UPDATED: {
                actions: ['updateNode', 'saveToUndoStack', 'markAsModified'],
              },
              LINK_UPDATED: {
                actions: ['updateLink', 'saveToUndoStack', 'markAsModified'],
              },
              NODE_DELETED: {
                actions: ['deleteNode', 'saveToUndoStack', 'markAsModified'],
              },
              LINK_DELETED: {
                actions: ['deleteLink', 'saveToUndoStack', 'markAsModified'],
              },
              COPY_SELECTION: {
                actions: ['copySelection'],
              },
              CUT_SELECTION: {
                actions: ['cutSelection', 'saveToUndoStack', 'markAsModified'],
              },
              PASTE_SELECTION: {
                actions: [
                  'pasteSelection',
                  'saveToUndoStack',
                  'markAsModified',
                ],
              },
              UNDO: {
                actions: ['performUndo'],
                guard: 'canUndo',
              },
              REDO: {
                actions: ['performRedo'],
                guard: 'canRedo',
              },
            },
          },

          validating: {
            entry: ['validateDiagram'],
            on: {
              VALIDATION_COMPLETED: {
                target: 'selecting',
              },
            },
          },
        },

        on: {
          SAVE_FILE: {
            target: 'saving',
          },
          EXPORT_JSON: {
            target: 'exporting',
            actions: ['setExportingFlag'],
          },
          EXPORT_PNG: {
            target: 'exporting',
            actions: ['setExportingFlag'],
          },
          VALIDATION_REQUESTED: {
            target: '.validating',
          },
          ERROR_OCCURRED: {
            target: 'error',
            actions: ['setError'],
          },
        },
      },

      importing: {
        invoke: {
          src: 'importFile',
          onDone: {
            target: 'ready',
            actions: ['setDiagramData', 'clearImportingFlag', 'clearHistory'],
          },
          onError: {
            target: 'error',
            actions: ['setError', 'clearImportingFlag'],
          },
        },
      },

      saving: {
        invoke: {
          src: 'saveFile',
          onDone: {
            target: 'ready',
            actions: ['clearModifiedFlag'],
          },
          onError: {
            target: 'error',
            actions: ['setError'],
          },
        },
      },

      exporting: {
        invoke: {
          src: 'exportFile',
          onDone: {
            target: 'ready',
            actions: ['clearExportingFlag'],
          },
          onError: {
            target: 'error',
            actions: ['setError', 'clearExportingFlag'],
          },
        },
      },

      error: {
        on: {
          ERROR_DISMISSED: {
            target: 'ready',
            actions: ['clearError'],
          },
        },
      },
    },
  },
  {
    actions: {
      setDiagramData: assign(({ context, event }) => {
        if (event.type === 'DIAGRAM_LOADED') {
          return {
            ...context,
            diagramData: event.data,
            isModified: false,
          };
        }
        return context;
      }),

      selectNode: assign(({ context, event }) => {
        if (event.type === 'NODE_SELECTED') {
          return {
            ...context,
            selectedNodeKey: event.nodeKey,
            selectedLinkKey: null,
          };
        }
        return context;
      }),

      selectLink: assign(({ context, event }) => {
        if (event.type === 'LINK_SELECTED') {
          return {
            ...context,
            selectedLinkKey: event.linkKey,
            selectedNodeKey: null,
          };
        }
        return context;
      }),

      deselectNode: assign(({ context }) => ({
        ...context,
        selectedNodeKey: null,
      })),

      deselectLink: assign(({ context }) => ({
        ...context,
        selectedLinkKey: null,
      })),

      setCurrentTool: assign(({ context, event }) => {
        if (event.type === 'TOOL_SELECTED') {
          return {
            ...context,
            currentTool: event.tool,
          };
        }
        return context;
      }),

      addNode: assign(({ context, event }) => {
        if (event.type === 'NODE_ADDED') {
          return {
            ...context,
            diagramData: {
              ...context.diagramData,
              nodeDataArray: [
                ...context.diagramData.nodeDataArray,
                event.nodeData,
              ],
            },
          };
        }
        return context;
      }),

      updateNode: assign(({ context, event }) => {
        if (event.type === 'NODE_UPDATED') {
          return {
            ...context,
            diagramData: {
              ...context.diagramData,
              nodeDataArray: context.diagramData.nodeDataArray.map((node) =>
                node.key === event.nodeData.key ? event.nodeData : node,
              ),
            },
          };
        }
        return context;
      }),

      deleteNode: assign(({ context, event }) => {
        if (event.type === 'NODE_DELETED') {
          return {
            ...context,
            diagramData: {
              ...context.diagramData,
              nodeDataArray: context.diagramData.nodeDataArray.filter(
                (node) => node.key !== event.nodeKey,
              ),
              linkDataArray: context.diagramData.linkDataArray.filter(
                (link) =>
                  link.from !== event.nodeKey && link.to !== event.nodeKey,
              ),
            },
          };
        }
        return context;
      }),

      addLink: assign(({ context, event }) => {
        if (event.type === 'LINK_ADDED') {
          return {
            ...context,
            diagramData: {
              ...context.diagramData,
              linkDataArray: [
                ...context.diagramData.linkDataArray,
                event.linkData,
              ],
            },
          };
        }
        return context;
      }),

      updateLink: assign(({ context, event }) => {
        if (event.type === 'LINK_UPDATED') {
          return {
            ...context,
            diagramData: {
              ...context.diagramData,
              linkDataArray: context.diagramData.linkDataArray.map((link) =>
                link.key === event.linkData.key ? event.linkData : link,
              ),
            },
          };
        }
        return context;
      }),

      deleteLink: assign(({ context, event }) => {
        if (event.type === 'LINK_DELETED') {
          return {
            ...context,
            diagramData: {
              ...context.diagramData,
              linkDataArray: context.diagramData.linkDataArray.filter(
                (link) => link.key !== event.linkKey,
              ),
            },
          };
        }
        return context;
      }),

      copySelection: assign(({ context }) => {
        const selectedNodes = context.diagramData.nodeDataArray.filter(
          (node) => node.key === context.selectedNodeKey,
        );
        const selectedLinks = context.diagramData.linkDataArray.filter(
          (link) => link.key === context.selectedLinkKey,
        );

        return {
          ...context,
          clipboard: {
            nodes: selectedNodes,
            links: selectedLinks,
          },
        };
      }),

      cutSelection: assign(({ context }) => {
        const selectedNodes = context.diagramData.nodeDataArray.filter(
          (node) => node.key === context.selectedNodeKey,
        );
        const selectedLinks = context.diagramData.linkDataArray.filter(
          (link) => link.key === context.selectedLinkKey,
        );

        return {
          ...context,
          clipboard: {
            nodes: selectedNodes,
            links: selectedLinks,
          },
          diagramData: {
            ...context.diagramData,
            nodeDataArray: context.diagramData.nodeDataArray.filter(
              (node) => node.key !== context.selectedNodeKey,
            ),
            linkDataArray: context.diagramData.linkDataArray.filter(
              (link) => link.key !== context.selectedLinkKey,
            ),
          },
        };
      }),

      pasteSelection: assign(({ context }) => {
        const newNodes = context.clipboard.nodes.map((node) => ({
          ...node,
          key:
            Math.max(
              ...context.diagramData.nodeDataArray.map((n) => n.key),
              0,
            ) + 1,
        }));
        const newLinks = context.clipboard.links.map((link) => ({
          ...link,
          key:
            Math.min(
              ...context.diagramData.linkDataArray.map((l) => l.key),
              0,
            ) - 1,
        }));

        return {
          ...context,
          diagramData: {
            ...context.diagramData,
            nodeDataArray: [...context.diagramData.nodeDataArray, ...newNodes],
            linkDataArray: [...context.diagramData.linkDataArray, ...newLinks],
          },
        };
      }),

      saveToUndoStack: assign(({ context }) => ({
        ...context,
        undoStack: [...context.undoStack, context.diagramData],
        redoStack: [], // Clear redo stack when new action is performed
      })),

      performUndo: assign(({ context }) => {
        const previousState = context.undoStack[context.undoStack.length - 1];
        const newUndoStack = context.undoStack.slice(0, -1);
        const newRedoStack = [...context.redoStack, context.diagramData];

        return {
          ...context,
          diagramData: previousState,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
        };
      }),

      performRedo: assign(({ context }) => {
        const nextState = context.redoStack[context.redoStack.length - 1];
        const newRedoStack = context.redoStack.slice(0, -1);
        const newUndoStack = [...context.undoStack, context.diagramData];

        return {
          ...context,
          diagramData: nextState,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
        };
      }),

      markAsModified: assign(({ context }) => ({
        ...context,
        isModified: true,
      })),

      clearModifiedFlag: assign(({ context }) => ({
        ...context,
        isModified: false,
      })),

      clearHistory: assign(({ context }) => ({
        ...context,
        undoStack: [],
        redoStack: [],
      })),

      loadExampleData: assign(({ context }) => ({
        ...context,
        diagramData: {
          nodeDataArray: [
            {
              key: 11,
              category: 'Start',
              location: '300 350',
              step: '11',
              text: 'Action 1',
            },
            { key: 12, category: 'Exclusive', location: '300 400' },
            { key: 13, location: '225 450', step: '13', text: 'Action 2' },
          ],
          linkDataArray: [
            { key: -8, from: 11, to: 12, text: 'condition 1' },
            { key: -9, from: 12, to: 13, text: 'condition 12' },
          ],
          modelData: { canRelink: true },
          skipsDiagramUpdate: false,
        },
        isModified: false,
      })),

      clearDiagram: assign(({ context }) => ({
        ...context,
        diagramData: initialDiagramData,
        isModified: false,
        selectedNodeKey: null,
        selectedLinkKey: null,
      })),

      setError: assign(({ context, event }) => {
        if (event.type === 'ERROR_OCCURRED') {
          return {
            ...context,
            error: event.error,
          };
        }
        return context;
      }),

      clearError: assign(({ context }) => ({
        ...context,
        error: null,
      })),

      setImportingFlag: assign(({ context }) => ({
        ...context,
        fileOperations: {
          ...context.fileOperations,
          isImporting: true,
        },
      })),

      clearImportingFlag: assign(({ context }) => ({
        ...context,
        fileOperations: {
          ...context.fileOperations,
          isImporting: false,
        },
      })),

      setExportingFlag: assign(({ context }) => ({
        ...context,
        fileOperations: {
          ...context.fileOperations,
          isExporting: true,
        },
      })),

      clearExportingFlag: assign(({ context }) => ({
        ...context,
        fileOperations: {
          ...context.fileOperations,
          isExporting: false,
        },
      })),

      validateDiagram: ({ context }) => {
        // Logique de validation du diagramme GRAFCET
        console.log('Validating diagram...', context.diagramData);
      },
    },

    guards: {
      canUndo: ({ context }) => context.undoStack.length > 0,
      canRedo: ({ context }) => context.redoStack.length > 0,
    },

    actors: {
      importFile: fromPromise(async ({ input }: { input: File }) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const jsonData = e.target?.result as string;
              const parsedData = JSON.parse(jsonData);
              resolve(parsedData);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(input);
        });
      }),

      saveFile: fromPromise(async ({ _input }) => {
        // Logique de sauvegarde
        return new Promise((resolve) => {
          setTimeout(() => resolve('File saved successfully'), 1000);
        });
      }),

      exportFile: fromPromise(async ({ _input }) => {
        // Logique d'export
        return new Promise((resolve) => {
          setTimeout(() => resolve('File exported successfully'), 1000);
        });
      }),
    },
  },
);
