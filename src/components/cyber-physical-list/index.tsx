import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

interface TreeNodeData {
  label: string;
  children?: TreeNodeData[];
}

interface TreeNodeProps {
  node: TreeNodeData;
  searchTerm: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const hasChildren = Boolean(node.children?.length);
  
  const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase());
  const childrenMatchSearch = node.children?.some(child => 
    child.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.children?.some(grandChild => 
      grandChild.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (searchTerm && !matchesSearch && !childrenMatchSearch) {
    return null;
  }

  return (
    <div className="ml-4">
      <div 
        className={`flex items-center space-x-2 p-1 hover:bg-gray-700 cursor-pointer ${
          matchesSearch ? 'bg-opacity-25' : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {hasChildren ? 
          (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : 
          <div className="w-4" />
        }
        <span className="text-sm">{node.label}</span>
      </div>
      
      {(isExpanded || searchTerm) && hasChildren && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode key={index} node={child} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
};

export const CyberPhysicalList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const treeData: TreeNodeData = {
    label: "Root",
    children: [
      {
        label: "Load",
        children: [
          { label: "Load 1" },
          { label: "Load 2" }
        ]
      },
      {
        label: "Line",
        children: [
          { label: "Line 1" },
          { label: "Line 2" }
        ]
      },
      {
        label: "Generator",
        children: [
          { label: "Generator 1" },
          { label: "Generator 2" }
        ]
      }
    ]
  };

  return (
    <div className="p-2">
      <div className="mb-4 flex items-center space-x-2 bg-gray-800 p-2 rounded">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>
      <TreeNode node={treeData} searchTerm={searchTerm} />
    </div>
  );
}