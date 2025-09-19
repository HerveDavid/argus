import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  parent: string;
  children: FileNode[];
}

interface DslExplorerStore {
  // État
  files: FileNode[];
  expandedFolders: Set<string>;
  currentPath: string;
  recentFiles: string[];
  recentFolders: string[];

  // Actions
  setFiles: (files: FileNode[]) => void;
  addFiles: (files: FileNode[]) => void;
  updateFiles: (updater: (files: FileNode[]) => FileNode[]) => void;
  setExpandedFolders: (expanded: Set<string>) => void;
  toggleFolder: (folderId: string) => void;
  setCurrentPath: (path: string) => void;
  addRecentFile: (filePath: string) => void;
  addRecentFolder: (folderPath: string) => void;
  clearFiles: () => void;
  removeFile: (fileId: string) => void;
  updateNodeName: (nodeId: string, newName: string) => void;
  updateNodeChildren: (parentId: string, children: FileNode[]) => void;
  addNode: (parentId: string | null, node: FileNode) => void;
}

// État initial
const initialState = {
  files: [] as FileNode[],
  expandedFolders: new Set<string>(),
  currentPath: 'No folder selected',
  recentFiles: [] as string[],
  recentFolders: [] as string[],
};

export const useDslExplorerStore = create<DslExplorerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFiles: (files: FileNode[]) => set({ files }),

      addFiles: (newFiles: FileNode[]) =>
        set((state) => ({ files: [...state.files, ...newFiles] })),

      updateFiles: (updater: (files: FileNode[]) => FileNode[]) =>
        set((state) => ({ files: updater(state.files) })),

      setExpandedFolders: (expanded: Set<string>) =>
        set({ expandedFolders: expanded }),

      toggleFolder: (folderId: string) => {
        const { expandedFolders } = get();
        const newExpanded = new Set(expandedFolders);

        if (newExpanded.has(folderId)) {
          newExpanded.delete(folderId);
        } else {
          newExpanded.add(folderId);
        }

        set({ expandedFolders: newExpanded });
      },

      setCurrentPath: (path: string) => {
        set({ currentPath: path });
        get().addRecentFolder(path);
      },

      addRecentFile: (filePath: string) => {
        const { recentFiles } = get();
        const newRecent = [
          filePath,
          ...recentFiles.filter((f) => f !== filePath),
        ].slice(0, 10);
        set({ recentFiles: newRecent });
      },

      addRecentFolder: (folderPath: string) => {
        const { recentFolders } = get();
        if (folderPath === 'No folder selected') return;
        const newRecent = [
          folderPath,
          ...recentFolders.filter((f) => f !== folderPath),
        ].slice(0, 5);
        set({ recentFolders: newRecent });
      },

      clearFiles: () =>
        set({
          files: [],
          expandedFolders: new Set(),
          currentPath: 'No folder selected',
        }),

      removeFile: (fileId: string) => {
        const removeFromTree = (nodes: FileNode[]): FileNode[] => {
          return nodes
            .filter((node) => node.id !== fileId)
            .map((node) => ({
              ...node,
              children: removeFromTree(node.children),
            }));
        };

        set((state) => ({ files: removeFromTree(state.files) }));
      },

      updateNodeName: (nodeId: string, newName: string) => {
        const updateInTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.id === nodeId) {
              return { ...node, name: newName };
            }
            return {
              ...node,
              children: updateInTree(node.children),
            };
          });
        };

        set((state) => ({ files: updateInTree(state.files) }));
      },

      updateNodeChildren: (parentId: string, children: FileNode[]) => {
        const updateInTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.id === parentId) {
              return { ...node, children: [...node.children, ...children] };
            }
            return {
              ...node,
              children: updateInTree(node.children),
            };
          });
        };

        set((state) => ({ files: updateInTree(state.files) }));
      },

      addNode: (parentId: string | null, node: FileNode) => {
        if (parentId) {
          get().updateNodeChildren(parentId, [node]);
          // Auto-expand le parent
          const { expandedFolders } = get();
          const newExpanded = new Set(expandedFolders);
          newExpanded.add(parentId);
          set({ expandedFolders: newExpanded });
        } else {
          set((state) => ({ files: [...state.files, node] }));
        }
      },
    }),
    {
      name: 'dsl-explorer-storage',
      // Configuration pour la persistance
      partialize: (state) => ({
        expandedFolders: Array.from(state.expandedFolders),
        currentPath: state.currentPath,
        recentFiles: state.recentFiles,
        recentFolders: state.recentFolders,
        // On ne persiste pas les files car ils dépendent du système de fichiers
      }),
      // Fonction pour reconstituer l'état depuis le localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reconstituer le Set depuis l'array
          if (Array.isArray(state.expandedFolders)) {
            state.expandedFolders = new Set(state.expandedFolders as string[]);
          }
          // Réinitialiser les files au démarrage (ils ne sont pas persistés)
          state.files = [];
        }
      },
    },
  ),
);
