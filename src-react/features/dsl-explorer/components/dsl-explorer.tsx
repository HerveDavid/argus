import React, { useState, useCallback } from 'react';
import { FolderOpen, File, FolderPlus, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readDir } from '@tauri-apps/plugin-fs';
import { useCentralPanelStore } from '@/stores/central-panel.store';
import { useDslExplorerStore, FileNode } from '../stores/dsl.store';
import { TreeNode } from './tree-node';

export const DslExplorer: React.FC = () => {
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addPanel } = useCentralPanelStore();

  // Utilisation du store
  const {
    files,
    expandedFolders,
    currentPath,
    recentFolders,
    setFiles,
    addFiles,
    toggleFolder: toggleFolderStore,
    setCurrentPath,
    addRecentFile,
    updateNodeName,
    updateNodeChildren,
    addNode: addNodeToStore,
  } = useDslExplorerStore();

  const convertToFileNode = useCallback(
    (entry: any, parentPath = ''): FileNode => {
      const isDirectory = entry.isDirectory || entry.children !== undefined;
      const fullPath = entry.path || `${parentPath}/${entry.name || 'unknown'}`;
      const name = entry.name || 'Unknown';

      console.log('Converting entry:', { entry, fullPath, name, isDirectory });

      return {
        id: fullPath,
        name: name,
        type: isDirectory ? 'folder' : 'file',
        path: fullPath,
        parent: parentPath,
        children: [],
      };
    },
    [],
  );

  const readDirectory = useCallback(
    async (dirPath: string): Promise<FileNode[]> => {
      try {
        console.log('Reading directory:', dirPath);
        const entries = await readDir(dirPath);
        console.log('Raw entries from readDir:', entries);

        const nodes: FileNode[] = [];

        for (const entry of entries) {
          console.log('Processing entry:', entry);

          if (!entry.name) {
            console.warn('Entry without name, skipping:', entry);
            continue;
          }

          const node = convertToFileNode(entry, dirPath);

          // Pour les dossiers, on ne lit pas récursivement tout de suite
          // On le fera à la demande lors de l'expansion
          if (entry.isDirectory) {
            node.children = []; // Laissé vide, sera chargé lors de l'expansion
          }

          nodes.push(node);
        }

        return nodes.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      } catch (error) {
        console.error('Error reading directory:', error);
        throw error;
      }
    },
    [convertToFileNode],
  );

  const openFolder = useCallback(async () => {
    try {
      setIsLoading(true);

      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: 'Select a folder',
      });

      if (selected) {
        const folderPath = Array.isArray(selected) ? selected[0] : selected;
        const folderName =
          folderPath.split('/').pop() ||
          folderPath.split('\\').pop() ||
          'Unknown';

        console.log('Opening folder:', { folderPath, folderName });

        const children = await readDirectory(folderPath);

        const newNode: FileNode = {
          id: folderPath,
          name: folderName,
          type: 'folder',
          path: folderPath,
          parent: '',
          children: children,
        };

        console.log('Created root node:', newNode);

        setFiles([newNode]);
        // Auto-expand le dossier racine
        const newExpanded = new Set([newNode.id]);
        useDslExplorerStore.getState().setExpandedFolders(newExpanded);
        setCurrentPath(folderPath);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    } finally {
      setIsLoading(false);
    }
  }, [readDirectory, setFiles, setCurrentPath]);

  const openFiles = useCallback(async () => {
    try {
      setIsLoading(true);

      const selected = await openDialog({
        multiple: true,
        title: 'Select files',
        filters: [
          {
            name: 'All files',
            extensions: ['*'],
          },
          {
            name: 'Text files',
            extensions: ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx'],
          },
        ],
      });

      if (selected && Array.isArray(selected)) {
        const newFiles: FileNode[] = selected.map((filePath) => {
          const fileName =
            filePath.split('/').pop() ||
            filePath.split('\\').pop() ||
            'Unknown';

          return {
            id: filePath,
            name: fileName,
            type: 'file',
            path: filePath,
            parent: '',
            children: [],
          };
        });

        addFiles(newFiles);
      }
    } catch (error) {
      console.error('Error opening files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addFiles]);

  const loadFolderContents = useCallback(
    async (node: FileNode) => {
      if (!node.path) {
        console.warn('Node without path, cannot load contents:', node);
        return;
      }

      try {
        setIsLoading(true);
        const children = await readDirectory(node.path);
        updateNodeChildren(node.id, children);
      } catch (error) {
        console.error('Error loading folder contents:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [readDirectory, updateNodeChildren],
  );

  const findNodeById = useCallback(
    (nodes: FileNode[], id: string): FileNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children.length > 0) {
          const found = findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  const toggleFolder = useCallback(
    async (folderId: string) => {
      const node = findNodeById(files, folderId);

      // Toggle l'état dans le store
      toggleFolderStore(folderId);

      // Si on ouvre le dossier et qu'il n'a pas encore de contenu, on le charge
      if (
        node &&
        !expandedFolders.has(folderId) &&
        node.children.length === 0 &&
        node.path
      ) {
        await loadFolderContents(node);
      }
    },
    [
      files,
      expandedFolders,
      findNodeById,
      toggleFolderStore,
      loadFolderContents,
    ],
  );

  const handleFileClick = useCallback(
    (node: FileNode) => {
      console.log('File clicked - node:', node);
      console.log('Path:', node.path, 'Name:', node.name);

      if (node.path && node.name) {
        console.log('Opening file in editor:', {
          path: node.path,
          name: node.name,
        });

        addPanel({
          id: node.path,
          tabComponent: 'editor',
          component: 'editor',
          params: {
            file: {
              filepath: node.path,
              filename: node.name,
            },
          },
        });

        // Ajouter aux fichiers récents
        addRecentFile(node.path);
      } else {
        console.error('Node missing required fields:', node);
      }
    },
    [addPanel, addRecentFile],
  );

  const addNode = useCallback(
    (parentId: string | null, type: 'file' | 'folder') => {
      let parentPath = '';

      if (parentId) {
        const parentNode = findNodeById(files, parentId);
        parentPath = parentNode?.path || '';
      }

      const nodeName = type === 'file' ? 'new-file.txt' : 'new-folder';
      const nodePath = parentPath ? `${parentPath}/${nodeName}` : nodeName;

      const newNode: FileNode = {
        id: nodePath,
        name: nodeName,
        type,
        path: nodePath,
        parent: parentPath,
        children: [],
      };

      console.log('Adding new node:', newNode);

      addNodeToStore(parentId, newNode);

      setEditingNode(newNode.id);
      setEditingValue(newNode.name);
    },
    [files, findNodeById, addNodeToStore],
  );

  const handleEdit = useCallback((nodeId: string, value: string) => {
    setEditingNode(nodeId);
    setEditingValue(value);
  }, []);

  const handleEditComplete = useCallback(() => {
    if (editingNode && editingValue.trim()) {
      updateNodeName(editingNode, editingValue.trim());
    }
    setEditingNode(null);
    setEditingValue('');
  }, [editingNode, editingValue, updateNodeName]);

  const handleEditCancel = useCallback(() => {
    setEditingNode(null);
    setEditingValue('');
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between p-3">
          <h3 className="truncate text-sm font-semibold" title={currentPath}>
            DSL Explorer
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={openFolder}
              title="Open a folder"
              disabled={isLoading}
            >
              <FolderOpen className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openFiles}
              title="Open files"
              disabled={isLoading}
            >
              <Upload className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addNode(null, 'file')}
              title="New file"
              disabled={isLoading}
            >
              <Plus className="mr-1 h-3 w-3" />
              <File className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addNode(null, 'folder')}
              title="New folder"
              disabled={isLoading}
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="px-3 pb-2">
          <div
            className="text-muted-foreground truncate text-xs"
            title={currentPath}
          >
            {currentPath}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="text-muted-foreground py-4 text-center text-sm">
            Loading...
          </div>
        )}

        {files.map((file: FileNode) => (
          <TreeNode
            key={file.id}
            node={file}
            level={0}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            onFileClick={handleFileClick}
            onAddNode={addNode}
            editingNode={editingNode}
            editingValue={editingValue}
            onEdit={handleEdit}
            onEditComplete={handleEditComplete}
            onEditCancel={handleEditCancel}
          />
        ))}

        {files.length === 0 && !isLoading && (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No files loaded. Open a folder or select files to get started.
          </div>
        )}
      </div>
    </div>
  );
};
