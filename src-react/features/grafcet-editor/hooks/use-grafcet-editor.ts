import { useMachine } from '@xstate/react';

import {
  DiagramData,
  LinkData,
  NodeData,
} from '@/features/grafcet-editor/types';

import { grafcetMachine } from '../machines/grafcet-machine';

export const useGrafcetEditor = () => {
  const [state, send] = useMachine(grafcetMachine);

  return {
    // États
    context: state.context,
    currentState: state.value,
    isIdle: state.matches('idle'),
    isReady: state.matches('ready'),
    isImporting: state.matches('importing'),
    isSaving: state.matches('saving'),
    isExporting: state.matches('exporting'),
    hasError: state.matches('error'),

    // Actions
    send,

    // Getters utiles
    canUndo: state.context.undoStack.length > 0,
    canRedo: state.context.redoStack.length > 0,
    hasSelection:
      state.context.selectedNodeKey !== null ||
      state.context.selectedLinkKey !== null,
    isModified: state.context.isModified,

    // Actions helper
    actions: {
      loadDiagram: (data: DiagramData) =>
        send({ type: 'DIAGRAM_LOADED', data }),
      selectNode: (nodeKey: number) => send({ type: 'NODE_SELECTED', nodeKey }),
      selectLink: (linkKey: number) => send({ type: 'LINK_SELECTED', linkKey }),
      deselectAll: () => {
        send({ type: 'NODE_DESELECTED' });
        send({ type: 'LINK_DESELECTED' });
      },
      addNode: (nodeData: NodeData) => send({ type: 'NODE_ADDED', nodeData }),
      updateNode: (nodeData: NodeData) =>
        send({ type: 'NODE_UPDATED', nodeData }),
      deleteNode: (nodeKey: number) => send({ type: 'NODE_DELETED', nodeKey }),
      addLink: (linkData: LinkData) => send({ type: 'LINK_ADDED', linkData }),
      updateLink: (linkData: LinkData) =>
        send({ type: 'LINK_UPDATED', linkData }),
      deleteLink: (linkKey: number) => send({ type: 'LINK_DELETED', linkKey }),
      selectTool: (tool: 'select' | 'addNode' | 'addLink' | 'delete') =>
        send({ type: 'TOOL_SELECTED', tool }),
      copy: () => send({ type: 'COPY_SELECTION' }),
      cut: () => send({ type: 'CUT_SELECTION' }),
      paste: () => send({ type: 'PASTE_SELECTION' }),
      undo: () => send({ type: 'UNDO' }),
      redo: () => send({ type: 'REDO' }),
      save: () => send({ type: 'SAVE_FILE' }),
      importFile: (file: File) => send({ type: 'IMPORT_FILE', file }),
      exportJSON: () => send({ type: 'EXPORT_JSON' }),
      exportPNG: () => send({ type: 'EXPORT_PNG' }),
      resetToExample: () => send({ type: 'RESET_TO_EXAMPLE' }),
      clearDiagram: () => send({ type: 'CLEAR_DIAGRAM' }),
      validate: () => send({ type: 'VALIDATION_REQUESTED' }),
      dismissError: () => send({ type: 'ERROR_DISMISSED' }),
    },
  };
};
