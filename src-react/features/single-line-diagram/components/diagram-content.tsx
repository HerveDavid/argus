import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { SVGContextMenu } from './svg-context-menu';
import { SldDiagram } from '@/types/sld-diagram';
import { SldMetadata, Node, Wire, FeederInfo } from '@/types/sld-metadata';

interface DiagramContentProps {
  svgRef: React.RefObject<SVGSVGElement>;
  diagramData?: SldDiagram | null;
}

interface ElementData {
  id: string;
  type:
    | 'breaker'
    | 'disconnector'
    | 'wire'
    | 'feeder'
    | 'busbar'
    | 'node'
    | 'other';
  element: Element;
  // Attributs SVG
  transform?: string;
  fill?: string;
  stroke?: string;
  className?: string;
  d?: string; // pour paths
  // Métadonnées enrichies
  equipmentId?: string;
  isOpen?: boolean;
  direction?: string;
  powerActive?: number;
  powerReactive?: number;
  // Priorité d'animation
  priority: number;
}

export const DiagramContent: React.FC<DiagramContentProps> = ({
  svgRef,
  diagramData,
}) => {
  const [targetElement, setTargetElement] = useState<SVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<
    SVGSVGElement,
    unknown
  > | null>(null);
  const currentTransformRef = useRef<d3.ZoomTransform | null>(null);
  const isInitializedRef = useRef(false);
  const lastSvgStringRef = useRef<string>('');
  const elementsDataRef = useRef<Map<string, ElementData>>(new Map());

  // Configuration du zoom
  const setupZoom = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      if (zoomBehaviorRef.current) return zoomBehaviorRef.current;

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          currentTransformRef.current = event.transform;
          const zoomGroup = svg.select<SVGGElement>('g.zoom-group');
          if (!zoomGroup.empty()) {
            zoomGroup.attr('transform', event.transform);
          }
        });

      svg.call(zoom).on('dblclick.zoom', null);
      zoomBehaviorRef.current = zoom;
      return zoom;
    },
    [],
  );

  // Wrapping du contenu dans un zoom group
  const wrapContentInZoomGroup = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      let zoomGroup = svg.select<SVGGElement>('g.zoom-group');
      if (zoomGroup.empty()) {
        const content = svg.node()?.innerHTML || '';
        svg.node()!.innerHTML = '';
        zoomGroup = svg.append<SVGGElement>('g').attr('class', 'zoom-group');
        zoomGroup.node()!.innerHTML = content;
      }
      return zoomGroup;
    },
    [],
  );

  // Initialisation initiale du SVG
  const initializeSvg = useCallback(
    async (svgString: string) => {
      if (!svgRef.current || !svgString?.trim()) return;

      const svg = d3.select(svgRef.current);

      try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

        const parserError = svgDoc.querySelector('parsererror');
        if (parserError) {
          console.error('Erreur de parsing SVG:', parserError.textContent);
          return;
        }

        const svgElement = svgDoc.documentElement;
        if (!svgElement || svgElement.tagName !== 'svg') {
          console.error('Document SVG invalide');
          return;
        }

        // Configuration des dimensions
        const viewBox = svgElement.getAttribute('viewBox');
        const originalWidth = svgElement.getAttribute('width');
        const originalHeight = svgElement.getAttribute('height');

        if (viewBox) {
          svg.attr('viewBox', viewBox);
        } else if (originalWidth && originalHeight) {
          svg.attr('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
        }

        // Importer le contenu initial INSTANTANÉMENT
        svg.node()!.innerHTML = svgElement.innerHTML;

        // Configuration responsive
        svg.attr('width', '100%').attr('height', '100%');

        // Setup zoom et pan
        const zoomGroup = wrapContentInZoomGroup(svg);
        setupZoom(svg);

        // Restaurer le transform s'il existe
        if (currentTransformRef.current) {
          zoomGroup.attr('transform', currentTransformRef.current.toString());
        }

        lastSvgStringRef.current = svgString;
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Erreur lors de l'initialisation SVG:", error);
      }
    },
    [svgRef, wrapContentInZoomGroup, setupZoom],
  );

  // Enrichir les données avec les métadonnées
  const enrichElementData = useCallback(
    (svgString: string, metadata?: SldMetadata): ElementData[] => {
      if (!svgString?.trim()) return [];

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');

        const parserError = doc.querySelector('parsererror');
        if (parserError) {
          console.error('SVG parsing error:', parserError.textContent);
          return [];
        }

        const elements: ElementData[] = [];

        // Créer des maps pour un accès rapide
        const nodeMap = new Map<string, Node>();
        const wireMap = new Map<string, Wire>();
        const feederMap = new Map<string, FeederInfo>();

        metadata?.nodes?.forEach((node) => {
          if (node?.id) {
            nodeMap.set(node.id, node);
            if (node.equipmentId) nodeMap.set(node.equipmentId, node);
          }
        });

        metadata?.wires?.forEach((wire) => {
          if (wire?.id) wireMap.set(wire.id, wire);
        });

        metadata?.feederInfos?.forEach((feeder) => {
          if (feeder?.id) feederMap.set(feeder.id, feeder);
        });

        // Extraire les éléments du SVG
        doc.querySelectorAll('[id]').forEach((element) => {
          if (!element?.id || element.id.trim() === '') return;

          const node = nodeMap.get(element.id);
          const wire = wireMap.get(element.id);
          const feeder = feederMap.get(element.id);
          const classList = element.getAttribute('class')?.split(' ') || [];

          // Déterminer le type et la priorité
          let type: ElementData['type'] = 'other';
          let priority = 5;

          if (
            classList.includes('sld-breaker') ||
            node?.componentType === 'BREAKER'
          ) {
            type = 'breaker';
            priority = 1;
          } else if (
            classList.includes('sld-disconnector') ||
            node?.componentType === 'DISCONNECTOR'
          ) {
            type = 'disconnector';
            priority = 2;
          } else if (classList.includes('sld-wire') || wire) {
            type = 'wire';
            priority = 3;
          } else if (
            classList.some((cls) => cls.includes('feeder')) ||
            feeder
          ) {
            type = 'feeder';
            priority = 4;
          } else if (classList.includes('sld-busbar-section')) {
            type = 'busbar';
            priority = 2;
          } else if (classList.includes('sld-node')) {
            type = 'node';
            priority = 6;
          }

          // Extraire les données de puissance
          let powerActive: number | undefined;
          let powerReactive: number | undefined;

          if (type === 'feeder' && element.textContent) {
            const text = element.textContent.trim();
            const numValue = parseFloat(text);
            if (!isNaN(numValue)) {
              if (classList.includes('sld-active-power')) {
                powerActive = numValue;
              } else if (classList.includes('sld-reactive-power')) {
                powerReactive = numValue;
              }
            }
          }

          elements.push({
            id: element.id,
            type,
            element: element.cloneNode(true) as Element,
            transform: element.getAttribute('transform') || undefined,
            fill: element.getAttribute('fill') || undefined,
            stroke: element.getAttribute('stroke') || undefined,
            className: element.getAttribute('class') || undefined,
            d: element.getAttribute('d') || undefined,
            equipmentId: node?.equipmentId,
            isOpen: node?.open,
            direction: node?.direction,
            powerActive,
            powerReactive,
            priority,
          });
        });

        return elements.sort((a, b) => a.priority - b.priority);
      } catch (error) {
        console.error('Error enriching element data:', error);
        return [];
      }
    },
    [],
  );

  // Fonction pour comparer les attributs d'un élément
  const getElementSignature = useCallback((data: ElementData): string => {
    return JSON.stringify({
      transform: data.transform,
      fill: data.fill,
      stroke: data.stroke,
      className: data.className,
      d: data.d,
      isOpen: data.isOpen,
      powerActive: data.powerActive,
      powerReactive: data.powerReactive,
    });
  }, []);

  // MÉTHODE SANS LOADING : Mise à jour atomique instantanée
  const updateSvgInstantly = useCallback(
    (newSvgString: string, metadata?: SldMetadata) => {
      if (!svgRef.current || !newSvgString?.trim()) return;
      if (newSvgString === lastSvgStringRef.current) return;

      const svg = d3.select(svgRef.current);
      let mainGroup = svg.select<SVGGElement>('g.zoom-group');

      if (mainGroup.empty()) {
        mainGroup = svg.append<SVGGElement>('g').attr('class', 'zoom-group');
      }

      const newElements = enrichElementData(newSvgString, metadata);
      if (!newElements || newElements.length === 0) return;

      // Créer une map des nouveaux éléments
      const newElementsMap = new Map<string, ElementData>();
      newElements.forEach((el) => newElementsMap.set(el.id, el));

      // Créer une map des éléments existants avec leurs signatures
      const existingElementsMap = new Map<
        string,
        { element: SVGElement; signature: string }
      >();
      mainGroup.selectAll<SVGElement, unknown>('[id]').each(function () {
        const element = this as SVGElement;
        if (element.id) {
          const currentData = newElementsMap.get(element.id);
          if (currentData) {
            existingElementsMap.set(element.id, {
              element,
              signature: getElementSignature({
                ...currentData,
                transform: element.getAttribute('transform') || undefined,
                fill: element.getAttribute('fill') || undefined,
                stroke: element.getAttribute('stroke') || undefined,
                className: element.getAttribute('class') || undefined,
                d: element.getAttribute('d') || undefined,
              }),
            });
          }
        }
      });

      // PHASE 1: Supprimer les éléments qui n'existent plus (INSTANTANÉ)
      mainGroup.selectAll<SVGElement, unknown>('[id]').each(function () {
        const element = this as SVGElement;
        if (element.id && !newElementsMap.has(element.id)) {
          element.remove();
        }
      });

      // PHASE 2: Traiter chaque élément (INSTANTANÉ)
      newElements.forEach((newData) => {
        const existing = existingElementsMap.get(newData.id);
        const newSignature = getElementSignature(newData);

        if (!existing) {
          // NOUVEAU ÉLÉMENT - Ajouter instantanément
          const importedNode = document.importNode(
            newData.element,
            true,
          ) as SVGElement;

          // Appliquer tous les attributs AVANT d'ajouter au DOM
          if (newData.transform)
            importedNode.setAttribute('transform', newData.transform);
          if (newData.fill) importedNode.setAttribute('fill', newData.fill);
          if (newData.stroke)
            importedNode.setAttribute('stroke', newData.stroke);
          if (newData.className)
            importedNode.setAttribute('class', newData.className);
          if (newData.d) importedNode.setAttribute('d', newData.d);

          // Ajouter l'élément avec opacité finale
          importedNode.style.opacity = '1';
          mainGroup.node()?.appendChild(importedNode);
        } else if (existing.signature !== newSignature) {
          // ÉLÉMENT MODIFIÉ - Mettre à jour instantanément
          const element = existing.element;

          // Appliquer tous les changements d'un coup
          if (newData.transform !== undefined) {
            element.setAttribute('transform', newData.transform);
          }
          if (newData.fill !== undefined) {
            element.setAttribute('fill', newData.fill);
          }
          if (newData.stroke !== undefined) {
            element.setAttribute('stroke', newData.stroke);
          }
          if (newData.className !== undefined) {
            element.setAttribute('class', newData.className);
          }
          if (newData.d !== undefined && newData.type === 'wire') {
            element.setAttribute('d', newData.d);
          }

          // Mise à jour du texte pour les feeders
          if (
            newData.type === 'feeder' &&
            (newData.powerActive !== undefined ||
              newData.powerReactive !== undefined)
          ) {
            const textElement = element.querySelector('text');
            if (textElement) {
              const targetValue =
                newData.powerActive || newData.powerReactive || 0;
              textElement.textContent = targetValue.toString();
            }
          }

          // État des breakers/disconnectors
          if (newData.type === 'breaker' || newData.type === 'disconnector') {
            if (newData.isOpen !== undefined) {
              if (newData.isOpen) {
                element.classList.remove('sld-closed');
                element.classList.add('sld-open');
              } else {
                element.classList.remove('sld-open');
                element.classList.add('sld-closed');
              }
            }
          }
        }
        // Si existing.signature === newSignature, ne rien faire (pas de changement)
      });

      // Restaurer le zoom
      if (currentTransformRef.current) {
        mainGroup.attr('transform', currentTransformRef.current.toString());
      }

      // Mettre à jour les références
      lastSvgStringRef.current = newSvgString;
      elementsDataRef.current.clear();
      newElements.forEach((el) => elementsDataRef.current.set(el.id, el));
    },
    [svgRef, enrichElementData, getElementSignature],
  );

  // Initialisation du zoom dès le premier rendu
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    setupZoom(svg);

    return () => {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current).on('.zoom', null);
        zoomBehaviorRef.current = null;
      }
    };
  }, [setupZoom]);

  // Mise à jour automatique SANS LOADING
  useEffect(() => {
    if (!diagramData?.svg || !svgRef.current) return;

    if (!isInitializedRef.current) {
      // Première initialisation - instantanée
      initializeSvg(diagramData.svg);
    } else {
      // Mises à jour suivantes - instantanées
      updateSvgInstantly(diagramData.svg, diagramData.metadata);
    }
  }, [
    diagramData?.svg,
    diagramData?.metadata,
    initializeSvg,
    updateSvgInstantly,
  ]);

  // Toggle breaker optimisé avec effet visuel minimal
  const toggleBreaker = useCallback(
    (breakerId: string, isClosed: boolean) => {
      if (!svgRef.current || !breakerId) return;

      const element = d3
        .select(svgRef.current)
        .select<SVGElement>(`#${breakerId}`);
      if (element.empty()) return;

      const node = element.node();
      if (!(node instanceof SVGElement)) return;

      // Changement d'état instantané avec effet subtil
      if (isClosed) {
        node.classList.remove('sld-closed');
        node.classList.add('sld-open');
      } else {
        node.classList.remove('sld-open');
        node.classList.add('sld-closed');
      }

      // Effet visuel très bref et subtil
      element
        .style('opacity', 0.8)
        .transition()
        .duration(100)
        .style('opacity', 1);
    },
    [svgRef],
  );

  const handleContextMenuTrigger = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const target = e.target as SVGElement;
      let element: SVGElement | null = target;

      while (
        element &&
        !element.id &&
        element.parentElement instanceof SVGElement
      ) {
        element = element.parentElement;
      }

      setTargetElement(element?.id ? element : null);
    },
    [],
  );

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <SVGContextMenu
          targetElement={targetElement}
          onToggleBreaker={toggleBreaker}
        >
          <svg
            ref={svgRef}
            className="w-full h-full cursor-default"
            style={{ minHeight: '400px' }}
            onContextMenu={handleContextMenuTrigger}
          />
        </SVGContextMenu>
      </div>
    </div>
  );
};
