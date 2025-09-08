import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  FolderPlus,
  Plus,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readDir } from '@tauri-apps/plugin-fs';
import { useCentralPanelStore } from '@/stores/central-panel.store';

interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  parent: string;
  children: FileNode[];
}

interface TreeNodeProps {
  node: FileNode;
  level: number;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  onFileClick: (node: FileNode) => void;
  onAddNode: (parentId: string, type: 'file' | 'folder') => void;
  editingNode: string | null;
  editingValue: string;
  onEdit: (nodeId: string, value: string) => void;
  onEditComplete: () => void;
  onEditCancel: () => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  expandedFolders,
  onToggleFolder,
  onFileClick,
  onAddNode,
  editingNode,
  editingValue,
  onEdit,
  onEditComplete,
  onEditCancel,
}) => {
  const isExpanded = expandedFolders.has(node.id);
  const hasChildren = node.children.length > 0;
  const isEditing = editingNode === node.id;

  const handleClick = () => {
    if (node.type === 'folder') {
      onToggleFolder(node.id);
    } else {
      onFileClick(node);
    }
  };

  const handleDoubleClick = () => {
    onEdit(node.id, node.name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEditComplete();
    }
    if (e.key === 'Escape') {
      onEditCancel();
    }
  };

  const paddingLeft = level * 16 + 8;

  return (
    <div className="select-none">
      <div
        className="hover:bg-accent/50 group flex items-center gap-1 rounded-sm px-2 py-1"
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        title={node.path}
      >
        {node.type === 'folder' ? (
          hasChildren ? (
            isExpanded ? (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            )
          ) : (
            <ChevronRight className="text-muted-foreground h-4 w-4 opacity-50" />
          )
        ) : (
          <div className="w-4" />
        )}

        {node.type === 'folder' ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-400" />
          ) : (
            <Folder className="h-4 w-4 text-blue-400" />
          )
        ) : (
          <File className="text-muted-foreground h-4 w-4" />
        )}

        {isEditing ? (
          <Input
            value={editingValue}
            onChange={(e) => onEdit(node.id, e.target.value)}
            onBlur={onEditComplete}
            onKeyDown={handleKeyPress}
            className="ml-1 h-6 flex-1 px-1 py-0 text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="ml-1 flex-1 cursor-pointer truncate text-sm">
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
                onAddNode(node.id, 'file');
              }}
              title="Add file"
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddNode(node.id, 'folder');
              }}
              title="Add folder"
              className="h-6 w-6 p-0"
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {node.type === 'folder' && hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onFileClick={onFileClick}
              onAddNode={onAddNode}
              editingNode={editingNode}
              editingValue={editingValue}
              onEdit={onEdit}
              onEditComplete={onEditComplete}
              onEditCancel={onEditCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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

  // Fonction pour convertir les entrées de fichiers Tauri en FileNode
  const convertToFileNode = (entry: any, parentPath = ''): FileNode => {
    const isDirectory = entry.isDirectory || entry.children !== undefined;
    const fullPath = entry.path || `${parentPath}/${entry.name || 'unknown'}`;

    // Validation et valeurs par défaut
    const name = entry.name || 'Unknown';

    console.log('Converting entry:', { entry, fullPath, name, isDirectory });

    return {
      id: fullPath, // Utilise le path comme ID
      name: name,
      type: isDirectory ? 'folder' : 'file',
      path: fullPath,
      parent: parentPath,
      children: [], // Toujours un tableau, même vide
    };
  };

  // Fonction pour lire récursivement un dossier avec l'API Tauri
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

        // Si c'est un dossier, on peut aussi lire son contenu (optionnel)
        if (entry.isDirectory) {
          try {
            const children = await readDirectory(
              entry.path || `${dirPath}/${entry.name}`,
            );
            node.children = children;
          } catch (error) {
            // Erreur de lecture du sous-dossier (permissions, etc.)
            console.warn(`Cannot read directory ${entry.path}:`, error);
            node.children = []; // Tableau vide au lieu d'undefined
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

  // Fonction pour ouvrir un dossier avec l'API Tauri
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

        console.log('Opening folder:', { folderPath, folderName });

        // Lire le contenu du dossier
        const children = await readDirectory(folderPath);

        const newNode: FileNode = {
          id: folderPath, // Utilise le path comme ID
          name: folderName,
          type: 'folder',
          path: folderPath,
          parent: '', // Pas de parent pour le dossier racine
          children: children,
        };

        console.log('Created root node:', newNode);

        // Remplacer tous les fichiers par le nouveau dossier ouvert
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

  // Fonction pour ouvrir des fichiers avec l'API Tauri
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
            id: filePath, // Utilise le path comme ID
            name: fileName,
            type: 'file',
            path: filePath,
            parent: '', // Pas de parent pour les fichiers individuels
            children: [], // Toujours un tableau vide pour les fichiers
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
    const timestamp = Date.now();
    let parentPath = '';

    if (parentId) {
      const parentNode = findNodeById(files, parentId);
      parentPath = parentNode?.path || '';
    }

    const nodeName = type === 'file' ? 'new-file.txt' : 'new-folder';
    const nodePath = parentPath ? `${parentPath}/${nodeName}` : nodeName;

    const newNode: FileNode = {
      id: nodePath, // Utilise le path comme ID
      name: nodeName,
      type,
      path: nodePath,
      parent: parentPath,
      children: [], // Toujours un tableau vide
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

        // Charger le contenu si le dossier n'a pas encore été chargé
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

    // Maintenant tous les champs sont garantis d'exister
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
    <div className="w-full max-w-md">
      <div className="">
        <div className="flex items-center justify-between p-3">
          <h3 className="truncate text-sm font-semibold" title={currentPath}>
            Explorer
          </h3>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={openFolder}
              title="Ouvrir un dossier"
              disabled={isLoading}
            >
              <FolderOpen className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openFiles}
              title="Ouvrir des fichiers"
              disabled={isLoading}
            >
              <Upload className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode(null, 'file')}
              title="New file"
              disabled={isLoading}
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
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Affichage du chemin actuel */}
        <div className="px-3 pb-2">
          <div
            className="text-muted-foreground truncate text-xs"
            title={currentPath}
          >
            {currentPath}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              Chargement...
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
              Aucun fichier. Cliquez sur 📁 pour ouvrir un dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
