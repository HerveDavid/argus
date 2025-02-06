import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Node {
  svgId: string;
  equipmentId: string;
  x: number;
  y: number;
}

interface Edge {
  svgId: string;
  equipmentId: string;
  node1: string;
  node2: string;
  busNode1: string;
  busNode2: string;
  type: string;
}

interface NetworkData {
  nodes: Node[];
  edges: Edge[];
}

interface TreeNodeData {
  label: string;
  type: 'node' | 'edge';
  data: Node | Edge;
  children?: TreeNodeData[];
}

interface TreeNodeProps {
  node: TreeNodeData;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const hasChildren = Boolean(node.children?.length);

  const getNodeDetails = () => {
    if (node.type === 'node') {
      const data = node.data as Node;
      return `${data.equipmentId} (${Math.round(data.x)}, ${Math.round(data.y)})`;
    } else {
      const data = node.data as Edge;
      return `${data.equipmentId} (${data.type})`;
    }
  };

  return (
    <div className="ml-4">
      <div 
        className="flex items-center space-x-2 p-1 hover:bg-gray-700 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {hasChildren ? 
          (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : 
          <div className="w-4" />
        }
        <span className="text-sm">{getNodeDetails()}</span>
      </div>
      
      {isExpanded && hasChildren && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode key={index} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const NetworkTree: React.FC<{ data: NetworkData }> = ({ data }) => {
  const buildTreeData = (): TreeNodeData => {
    const nodesByType = new Map<string, Node[]>();
    data.nodes.forEach(node => {
      const type = node.equipmentId.split('_')[0];
      if (!nodesByType.has(type)) {
        nodesByType.set(type, []);
      }
      nodesByType.get(type)?.push(node);
    });

    const edgesByType = new Map<string, Edge[]>();
    data.edges.forEach(edge => {
      const type = edge.type;
      if (!edgesByType.has(type)) {
        edgesByType.set(type, []);
      }
      edgesByType.get(type)?.push(edge);
    });

    return {
      label: "Network",
      type: 'node',
      data: {} as Node,
      children: [
        {
          label: "Nodes",
          type: 'node',
          data: {} as Node,
          children: Array.from(nodesByType.entries()).map(([type, nodes]) => ({
            label: type,
            type: 'node',
            data: {} as Node,
            children: nodes.map(node => ({
              label: node.equipmentId,
              type: 'node',
              data: node
            }))
          }))
        },
        {
          label: "Edges",
          type: 'edge',
          data: {} as Edge,
          children: Array.from(edgesByType.entries()).map(([type, edges]) => ({
            label: type,
            type: 'edge',
            data: {} as Edge,
            children: edges.map(edge => ({
              label: edge.equipmentId,
              type: 'edge',
              data: edge
            }))
          }))
        }
      ]
    };
  };

  return (
    <div className="p-2">
      <TreeNode node={buildTreeData()} />
    </div>
  );
};

export default NetworkTree;