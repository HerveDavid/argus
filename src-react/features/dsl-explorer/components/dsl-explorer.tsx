import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Plus,
  FolderPlus,
  FileText,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCentralPanelStore } from '@/stores/central-panel.store';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readDir } from '@tauri-apps/plugin-fs';
import { FileNode } from '../types/file-node.type';

export const DslExplorer = () => {
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'components',
          type: 'folder',
          parent: '1',
          children: [
            { id: '3', name: 'Button.tsx', type: 'file', parent: '2' },
            { id: '4', name: 'Input.tsx', type: 'file', parent: '2' },
          ],
        },
        { id: '5', name: 'App.tsx', type: 'file', parent: '1' },
      ],
    },
    { id: '6', name: 'package.json', type: 'file' },
  ]);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['1', '2']),
  );
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [currentPath, setCurrentPath] = useState('/home/twin-eu/');
  const [isLoading, setIsLoading] = useState(false);

  const { addPanel } = useCentralPanelStore();

  const handleFileClick = (filepath: string, filename: string) => {
    addPanel({
      id: filepath,
      tabComponent: 'editor',
      component: 'editor',
      params: {
        file: {
          filepath: filepath,
          filename: filename,
        },
      },
    });
  };

  // Fonction pour convertir les entrées de fichiers Tauri en FileNode
  const convertToFileNode = (entry: any, parentId?: string): FileNode => {
    const isDirectory = entry.isDirectory || entry.children !== undefined;
    return {
      id: `${entry.path}-${Date.now()}-${Math.random()}`,
      name: entry.name,
      type: isDirectory ? 'folder' : 'file',
      path: entry.path,
      parent: parentId,
      children: isDirectory ? [] : undefined,
    };
  };

  // Fonction pour lire récursivement un dossier
  const readDirectory = async (dirPath: string): Promise<FileNode[]> => {
    try {
      const entries = await readDir(dirPath);
      const nodes: FileNode[] = [];

      for (const entry of entries) {
        const node = convertToFileNode(entry);

        // Si c'est un dossier, on peut aussi lire son contenu (optionnel)
        if (entry.isDirectory) {
          try {
            const children = await readDirectory(entry.path);
            node.children = children;
          } catch (error) {
            // Erreur de lecture du sous-dossier (permissions, etc.)
            console.warn(`Cannot read directory ${entry.path}:`, error);
            node.children = [];
          }
        }

        nodes.push(node);
      }

      return nodes.sort((a, b) => {
        // Trier : dossiers d'abord, puis par nom
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

  // Fonction pour ouvrir un dossier
  const openFolder = async () => {
    try {
      setIsLoading(true);

      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: 'Sélectionner un dossier',
      });

      if (selected) {
        const folderPath = Array.isArray(selected) ? selected[0] : selected;
        const folderName =
          folderPath.split('/').pop() ||
          folderPath.split('\\').pop() ||
          'Unknown';

        // Lire le contenu du dossier
        const children = await readDirectory(folderPath);

        const newNode: FileNode = {
          id: `folder-${Date.now()}`,
          name: folderName,
          type: 'folder',
          path: folderPath,
          children: children,
        };

        // Ajouter le dossier à la racine
        setFiles((prev) => [...prev, newNode]);
        setExpandedFolders((prev) => new Set(prev).add(newNode.id));
        setCurrentPath(folderPath);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      // Vous pourriez ajouter une notification d'erreur ici
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ouvrir des fichiers
  const openFiles = async () => {
    try {
      setIsLoading(true);

      const selected = await openDialog({
        multiple: true,
        title: 'Sélectionner des fichiers',
        filters: [
          {
            name: 'Tous les fichiers',
            extensions: ['*'],
          },
          {
            name: 'Fichiers texte',
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
            id: `file-${Date.now()}-${Math.random()}`,
            name: fileName,
            type: 'file',
            path: filePath,
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

  // Fonction pour charger paresseusement le contenu d'un dossier
  const loadFolderContents = async (node: FileNode) => {
    if (!node.path || node.children === undefined) return;

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

  const toggleFolder = async (folderId: string) => {
    const node = findNodeById(files, folderId);

    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);

        // Charger le contenu si le dossier n'a pas encore été chargé
        if (node && node.children && node.children.length === 0 && node.path) {
          loadFolderContents(node);
        }
      }
      return newSet;
    });
  };

  const findNodeById = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const addNode = (parentId: string | null, type: 'file' | 'folder') => {
    const newId = Date.now().toString();
    const newNode: FileNode = {
      id: newId,
      name: type === 'file' ? 'new-file.txt' : 'new-folder',
      type,
      parent: parentId || undefined,
      children: type === 'folder' ? [] : undefined,
    };

    if (parentId) {
      setFiles((prev) => updateNodeChildren(prev, parentId, newNode));
      setExpandedFolders((prev) => new Set(prev).add(parentId));
    } else {
      setFiles((prev) => [...prev, newNode]);
    }

    setEditingNode(newId);
    setEditingValue(newNode.name);
  };

  const updateNodeChildren = (
    nodes: FileNode[],
    parentId: string,
    ...newNodes: FileNode[]
  ): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === parentId && node.children) {
        return { ...node, children: [...node.children, ...newNodes] };
      }
      if (node.children) {
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
      if (node.children) {
        return {
          ...node,
          children: updateNodeName(node.children, nodeId, newName),
        };
      }
      return node;
    });
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    }
    if (e.key === 'Escape') {
      setEditingNode(null);
      setEditingValue('');
    }
  };

  // NOUVEAU : Gérer le simple clic pour ouvrir le fichier
  const handleSingleClick = (node: FileNode) => {
    if (node.type === 'file') {
      // Pour les fichiers chargés depuis le système de fichiers
      if (node.path) {
        handleFileClick(node.path, node.name);
      } else {
        // Pour les fichiers créés manuellement (fallback)
        handleFileClick(crypto.randomUUID(), node.name);
      }
    }
  };

  // NOUVEAU : Gérer le double clic pour éditer le nom
  const handleDoubleClick = (node: FileNode) => {
    setEditingNode(node.id);
    setEditingValue(node.name);
  };

  const TreeNode = ({
    node,
    level = 0,
  }: {
    node: FileNode;
    level?: number;
  }) => {
    const isExpanded = expandedFolders.has(node.id);
    const isEditing = editingNode === node.id;

    return (
      <div className="select-none">
        <div
          className="hover:bg-accent/50 group flex items-center gap-1 rounded-sm px-2 py-1"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleSingleClick(node)} // Simple clic : ouvre le fichier
          onDoubleClick={() => handleDoubleClick(node)} // Double clic : édite le nom
        >
          {node.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
              className="hover:bg-accent rounded-sm p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {node.type === 'folder' ? (
            <Folder className="text-muted-foreground h-4 w-4" />
          ) : (
            <FileText className="text-muted-foreground h-4 w-4" />
          )}

          {isEditing ? (
            <Input
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={handleKeyPress}
              className="ml-1 h-6 flex-1 px-1 py-0 text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="ml-1 flex-1 cursor-pointer text-sm"
              title={node.path}
            >
              {node.name}
            </span>
          )}

          {node.type === 'folder' && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addNode(node.id, 'file');
                }}
                title="Add file"
              >
                <Plus className="h-3 w-3" />
                <File className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addNode(node.id, 'folder');
                }}
                title="Add folder"
              >
                <FolderPlus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {node.type === 'folder' && node.children && isExpanded && (
          <div>
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md">
      <div className="">
        <div className="flex items-center justify-between p-3">
          <h3 className="text-sm font-semibold" title={currentPath}>
            {currentPath}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={openFolder}
              title="Ouvrir un dossier"
              disabled={isLoading}
              type="button"
            >
              <FolderOpen className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openFiles}
              title="Ouvrir des fichiers"
              disabled={isLoading}
              type="button"
            >
              <Upload className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode(null, 'file')}
              title="New file"
              disabled={isLoading}
              type="button"
            >
              <Plus className="mr-1 h-3 w-3" />
              <File className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode(null, 'folder')}
              title="New folder"
              disabled={isLoading}
              type="button"
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              Chargement...
            </div>
          )}

          {files.map((file: FileNode) => (
            <TreeNode key={file.id} node={file} />
          ))}

          {files.length === 0 && !isLoading && (
            <div className="text-muted-foreground py-8 text-center text-sm">
              Aucun fichier. Utilisez les boutons + ou 📁 pour commencer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
