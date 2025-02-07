import { File, Folder, Tree, TreeViewElement } from '@/components/ui/tree-view';
import { MetadataGrid } from '../../types/metadata-grid';
import { useEffect, useState } from 'react';
import { getMetadataGrid } from '../../api/get-metadata-grid';

const convertNetworkToTree = (data: MetadataGrid): TreeViewElement[] => {
  const rootElements: TreeViewElement[] = [];

  // Création d'un élément racine pour les nœuds
  const nodesElement: TreeViewElement = {
    id: 'nodes',
    name: 'Nodes',
    isSelectable: true,
    children: data.nodes.map((node) => ({
      id: node.svgId,
      name: `${node.equipmentId} (${node.x.toFixed(2)}, ${node.y.toFixed(2)})`,
      isSelectable: true,
    })),
  };
  rootElements.push(nodesElement);

  // Création d'un élément racine pour les bus
  const busNodesElement: TreeViewElement = {
    id: 'busNodes',
    name: 'Bus Nodes',
    isSelectable: true,
    children: data.busNodes.map((node) => ({
      id: node.svgId,
      name: `${node.equipmentId} (Neighbours: ${node.nbNeighbours})`,
      isSelectable: true,
    })),
  };
  rootElements.push(busNodesElement);

  // Création d'un élément racine pour les arêtes
  const edgesElement: TreeViewElement = {
    id: 'edges',
    name: 'Edges',
    isSelectable: true,
    children: data.edges.map((edge) => ({
      id: edge.svgId,
      name: `${edge.equipmentId} (${edge.type})`,
      isSelectable: true,
    })),
  };
  rootElements.push(edgesElement);

  return rootElements;
};

export function CyberPhysicalList() {
  const [elements, setElements] = useState<TreeViewElement[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await getMetadataGrid();
      const treeElements = convertNetworkToTree(data);
      setElements(treeElements);

      // Définir les éléments initialement expandés
      const initialExpanded = ['nodes', 'busNodes', 'edges'];
      setExpandedItems(initialExpanded);
    };

    loadData();
  }, []);

  const renderTreeContent = (elements: TreeViewElement[]) => {
    return elements.map((element) => {
      if (element.children) {
        return (
          <Folder key={element.id} value={element.id} element={element.name}>
            {renderTreeContent(element.children)}
          </Folder>
        );
      }
      return (
        <File key={element.id} value={element.id}>
          <p>{element.name}</p>
        </File>
      );
    });
  };

  return (
    <div className="h-full p-4">
      <h2 className="text-xl font-bold mb-4">Network Structure</h2>
      <Tree
        className="h-[calc(100%-2rem)] overflow-hidden rounded-md bg-background p-2" // Modification ici
        initialSelectedId="nodes"
        initialExpandedItems={expandedItems}
        elements={elements}
      >
        {elements.length > 0 && renderTreeContent(elements)}
      </Tree>
    </div>
  );
}
