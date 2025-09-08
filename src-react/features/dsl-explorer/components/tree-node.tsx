import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  FolderPlus,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export const TreeNode: React.FC<TreeNodeProps> = ({
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
            <FolderOpen className="h-4 w-4 text-accent" />
          ) : (
            <Folder className="h-4 w-4 text-accent" />
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
