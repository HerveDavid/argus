import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Plus,
  FolderPlus,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCentralPanelStore } from '@/stores/central-panel.store';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  parent?: string;
}

export const TreeFolder = () => {
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

  const { addPanel } = useCentralPanelStore();

  const handleClick = () => {
    addPanel({
      id: 'dsl',
      tabComponent: 'default',
      component: 'editor',
      params: {},
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
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
    newNode: FileNode,
  ): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === parentId && node.children) {
        return { ...node, children: [...node.children, newNode] };
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeChildren(node.children, parentId, newNode),
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
      <div className="select-none" onClick={handleClick}>
        <div
          className="flex items-center gap-1 py-1 px-2 hover:bg-accent/50 rounded-sm group"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {node.type === 'folder' && (
            <button
              onClick={() => toggleFolder(node.id)}
              className="p-0.5 hover:bg-accent rounded-sm"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {node.type === 'folder' ? (
            <Folder className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}

          {isEditing ? (
            <Input
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={handleKeyPress}
              className="h-6 text-sm py-0 px-1 ml-1 flex-1"
              autoFocus
            />
          ) : (
            <span
              className="text-sm flex-1 ml-1 cursor-pointer"
              onClick={() => {
                setEditingNode(node.id);
                setEditingValue(node.name);
              }}
            >
              {node.name}
            </span>
          )}

          {node.type === 'folder' && (
            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
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
    <div className="w-full max-w-md mx-auto">
      <div className="">
        <div className="flex items-center justify-between p-3">
          <h3 className="font-semibold text-sm">/home/twin-eu/</h3>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode(null, 'file')}
              title="New file"
              type="button"
            >
              <Plus className="h-3 w-3 mr-1" />
              <File className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode(null, 'folder')}
              title="New folder"
              type="button"
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="p-2 max-h-96 overflow-y-auto">
          {files.map((file: FileNode) => (
            <TreeNode key={file.id} node={file} />
          ))}

          {files.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No files. Click the + buttons to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
