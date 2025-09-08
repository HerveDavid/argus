import React, { useState } from 'react';
import { FolderOpen, File, FolderPlus, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readDir } from '@tauri-apps/plugin-fs';
import { useCentralPanelStore } from '@/stores/central-panel.store';
import { TreeNode } from './tree-node';

interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  parent: string;
  children: FileNode[];
}

export const DslExplorer: React.FC = () => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [currentPath, setCurrentPath] = useState('No folder selected');
  const [isLoading, setIsLoading] = useState(false);
  const { addPanel } = useCentralPanelStore();

  const convertToFileNode = (entry: any, parentPath = ''): FileNode => {
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
  };

  const readDirectory = async (dirPath: string): Promise<FileNode[]> => {
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

        if (entry.isDirectory) {
          try {
            const children = await readDirectory(
              entry.name || `${dirPath}/${entry.name}`,
            );
            node.children = children;
          } catch (error) {
            console.warn(`Cannot read directory ${entry.name}:`, error);
            node.children = [];
          }
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
  };

  const openFolder = async () => {
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
        setExpandedFolders(new Set([newNode.id]));
        setCurrentPath(folderPath);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openFiles = async () => {
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

        setFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error opening files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolderContents = async (node: FileNode) => {
    if (!node.path) {
      console.warn('Node without path, cannot load contents:', node);
      return;
    }

    try {
      setIsLoading(true);
      const children = await readDirectory(node.path);

      setFiles((prev) => updateNodeChildren(prev, node.id, ...children));
    } catch (error) {
      console.error('Error loading folder contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const findNodeById = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children.length > 0) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateNodeChildren = (
    nodes: FileNode[],
    parentId: string,
    ...newNodes: FileNode[]
  ): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, ...newNodes] };
      }
      if (node.children.length > 0) {
        return {
          ...node,
          children: updateNodeChildren(node.children, parentId, ...newNodes),
        };
      }
      return node;
    });
  };

  const updateNodeName = (
    nodes: FileNode[],
    nodeId: string,
    newName: string,
  ): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, name: newName };
      }
      if (node.children.length > 0) {
        return {
          ...node,
          children: updateNodeName(node.children, nodeId, newName),
        };
      }
      return node;
    });
  };

  const addNode = (parentId: string | null, type: 'file' | 'folder') => {
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

    if (parentId) {
      setFiles((prev) => updateNodeChildren(prev, parentId, newNode));
      setExpandedFolders((prev) => new Set(prev).add(parentId));
    } else {
      setFiles((prev) => [...prev, newNode]);
    }

    setEditingNode(newNode.id);
    setEditingValue(newNode.name);
  };

  const toggleFolder = async (folderId: string) => {
    const node = findNodeById(files, folderId);

    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);

        if (node && node.children.length === 0 && node.path) {
          loadFolderContents(node);
        }
      }
      return newSet;
    });
  };

  const handleFileClick = (node: FileNode) => {
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
    } else {
      console.error('Node missing required fields:', node);
    }
  };

  const handleEdit = (nodeId: string, value: string) => {
    setEditingNode(nodeId);
    setEditingValue(value);
  };

  const handleEditComplete = () => {
    if (editingNode && editingValue.trim()) {
      setFiles((prev) =>
        updateNodeName(prev, editingNode, editingValue.trim()),
      );
    }
    setEditingNode(null);
    setEditingValue('');
  };

  const handleEditCancel = () => {
    setEditingNode(null);
    setEditingValue('');
  };

  return (
    <div className="flex h-full flex-col">
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between p-3">
          <h3 className="truncate text-sm font-semibold" title={currentPath}>
            scenario_MQIS_NB
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
            No file, open a dir.
          </div>
        )}
      </div>
    </div>
  );
};
