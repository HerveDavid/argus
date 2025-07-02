import { useEffect } from 'react';
import * as d3 from 'd3';
import { SldMetadata, Node } from '@/types/sld-metadata';

interface DiagramNavigationProps {
  svgRef: React.RefObject<SVGSVGElement>;
  metadata?: SldMetadata;
  onGoToVoltageLevel?: (nextVId: string) => void;
}

export const useDiagramNavigation = ({
  svgRef,
  metadata,
  onGoToVoltageLevel,
}: DiagramNavigationProps) => {
  // Fonction pour déterminer le type de composant à partir des classes CSS
  const getComponentTypeFromClasses = (classList: string[]): string | null => {
    for (const cls of classList) {
      if (cls.startsWith('sld-')) {
        const potentialType = cls.replace('sld-', '').toUpperCase();

        if (potentialType === 'SUBSTATION') return 'SUBSTATION';
        if (potentialType === 'VOLTAGE_LEVEL') return 'VOLTAGE_LEVEL';
        if (potentialType === 'LINE') return 'LINE';
        if (potentialType === 'LABEL') return 'LABEL';
      }
    }
    return null;
  };

  // Fonction pour trouver les informations du nœud dans les métadonnées
  const findNodeInfo = (
    elementId: string,
    metadata?: SldMetadata,
  ): Node | null => {
    if (!metadata || !elementId) return null;

    return (
      metadata.nodes.find(
        (node) => node.id === elementId || node.equipmentId === elementId,
      ) || null
    );
  };

  // Fonction pour extraire l'equipment ID à partir de l'ID de l'élément
  const extractEquipmentId = (elementId: string): string | null => {
    if (elementId && !elementId.includes('_')) {
      return elementId;
    }

    if (elementId && elementId.includes('_')) {
      const parts = elementId.split('_');
      if (parts.length > 1) {
        return parts[0];
      }
    }

    return null;
  };

  // Fonction pour déterminer si c'est un label navigable
  const isNavigableLabel = (
    element: SVGElement,
    componentType: string | null,
    text: string,
  ): boolean => {
    const classList =
      element.getAttribute('class')?.split(' ').filter(Boolean) || [];
    const isLabel = classList.includes('sld-label');

    if (!isLabel || !text) return false;

    return (
      componentType === 'SUBSTATION' ||
      componentType === 'VOLTAGE_LEVEL' ||
      componentType === 'LINE' ||
      text.toLowerCase().includes('substation') ||
      text.toLowerCase().includes('voltage') ||
      text.toLowerCase().includes('level')
    );
  };

  // Fonction pour gérer les clics sur les labels
  const handleLabelClick = (event: MouseEvent) => {
    if (!onGoToVoltageLevel || !metadata) return;

    const target = event.target as SVGElement;
    if (!target || target.tagName !== 'text') return;

    const classList =
      target.getAttribute('class')?.split(' ').filter(Boolean) || [];
    if (!classList.includes('sld-label')) return;

    const id = target.id || '';
    const text = target.textContent || '';
    const componentType = getComponentTypeFromClasses(classList);
    const equipmentId = extractEquipmentId(id);

    // Trouver les informations du nœud
    const nodeInfo =
      findNodeInfo(id, metadata) || findNodeInfo(equipmentId || '', metadata);
    const finalComponentType = nodeInfo?.componentType || componentType;

    // Vérifier si c'est navigable
    if (isNavigableLabel(target, finalComponentType, text)) {
      event.preventDefault();
      event.stopPropagation();

      // Déterminer la destination
      let destination: string;

      if (finalComponentType === 'LINE' && nodeInfo?.nextVId) {
        // Pour les lignes, utiliser nextVId
        destination = nodeInfo.nextVId;
      } else {
        // Pour les substations et voltage levels, utiliser equipmentId, id ou text
        destination = nodeInfo?.equipmentId || equipmentId || id || text;
      }

      if (destination) {
        onGoToVoltageLevel(destination);
      }
    }
  };

  // Ajouter cette fonction après isNavigableLabel
  const addHoverEffects = () => {
    if (!svgRef.current || !metadata) return;

    const svg = d3.select(svgRef.current);

    svg.selectAll('.sld-label').each(function () {
      const element = this as SVGElement;
      const id = element.id || '';
      const text = element.textContent || '';
      const classList =
        element.getAttribute('class')?.split(' ').filter(Boolean) || [];

      const componentType = getComponentTypeFromClasses(classList);
      const equipmentId = extractEquipmentId(id);
      const nodeInfo =
        findNodeInfo(id, metadata) || findNodeInfo(equipmentId || '', metadata);
      const finalComponentType = nodeInfo?.componentType || componentType;

      if (isNavigableLabel(element, finalComponentType, text)) {
        d3.select(element)
          .style('cursor', 'pointer')
          .on('mouseenter', function () {
            d3.select(this)
              .style('text-decoration', 'underline')
              .style('opacity', '0.7');
          })
          .on('mouseleave', function () {
            d3.select(this)
              .style('text-decoration', 'none')
              .style('opacity', '1');
          });
      }
    });
  };

  // Effect pour configurer les événements
  useEffect(() => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    svgElement.addEventListener('click', handleLabelClick);

    // Ajouter les effets de hover
    const timeoutId = setTimeout(() => {
      addHoverEffects();
    }, 100);

    return () => {
      svgElement.removeEventListener('click', handleLabelClick);
      clearTimeout(timeoutId);
    };
  }, [svgRef.current, metadata, onGoToVoltageLevel]);

  return {
    isNavigableLabel,
  };
};
