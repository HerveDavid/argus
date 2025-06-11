import {
  Folder,
  ChevronRight,
  ChevronDown,
  File,
  FolderOpen,
} from 'lucide-react';
import { useState } from 'react';

export const FileTreeItem = ({
  item,
  level = 0,
}: {
  item: any;
  level?: number;
}) => {
  const [expanded, setExpanded] = useState(item.expanded || false);

  const handleToggle = () => {
    if (item.type === 'folder') {
      setExpanded(!expanded);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-sm text-sm`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleToggle}
      >
        {item.type === 'folder' ? (
          <>
            {expanded ? (
              <ChevronDown className="w-3 h-3 mr-1" />
            ) : (
              <ChevronRight className="w-3 h-3 mr-1" />
            )}
            {expanded ? (
              <FolderOpen className="size-4 mr-2 text-blue-500" />
            ) : (
              <Folder className="size-4 mr-2 text-blue-500" />
            )}
          </>
        ) : (
          <>
            <div className="size-4 mr-2" />
            <File className="size-4 mr-2 text-gray-500" />
          </>
        )}
        <span className="truncate">{item.name}</span>
      </div>
      {item.type === 'folder' && expanded && item.children && (
        <div>
          {item.children.map((child: any, index: number) => (
            <FileTreeItem key={index} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
