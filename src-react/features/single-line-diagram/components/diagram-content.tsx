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
  const transitionDuration = 500;
  const isInitializedRef = useRef(false);

  // Configuration du zoom (du hook useSvgRenderer)
  const setupZoom = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      if (zoomBehaviorRef.current) return zoomBehaviorRef.current; // Retourner l'existant

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          currentTransformRef.current = event.transform;
          const zoomGroup = svg.select('g.zoom-group');
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

  // Wrapping du contenu dans un zoom group (du hook useSvgRenderer)
  const wrapContentInZoomGroup = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      let zoomGroup = svg.select('g.zoom-group');
      if (zoomGroup.empty()) {
        const content = svg.node()?.innerHTML || '';
        svg.node()!.innerHTML = '';
        zoomGroup = svg.append('g').attr('class', 'zoom-group');
        zoomGroup.node()!.innerHTML = content;
      }
      return zoomGroup;
    },
    [],
  );

  // Initialisation initiale du SVG (du hook useSvgRenderer)
  const initializeSvg = useCallback(
    async (svgString: string) => {
      if (!svgRef.current || !svgString?.trim()) return;

      const svg = d3.select(svgRef.current);

      try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

        // Vérifier les erreurs de parsing
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

        // Importer le contenu initial
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

        // Vérifier les erreurs de parsing
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

        // Extraire les éléments du SVG avec vérifications
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
            priority = 1; // Priorité maximale
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

          // Extraire les données de puissance depuis les labels
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

        // Trier par priorité pour les animations
        return elements.sort((a, b) => a.priority - b.priority);
      } catch (error) {
        console.error('Error enriching element data:', error);
        return [];
      }
    },
    [],
  );

  // Data join optimisé avec animations par priorité
  const updateSvgWithDataJoin = useCallback(
    (newSvgString: string, metadata?: SldMetadata) => {
      if (!svgRef.current || !newSvgString?.trim()) return;

      const svg = d3.select(svgRef.current);
      let mainGroup = svg.select<SVGGElement>('g.zoom-group');

      if (mainGroup.empty()) {
        mainGroup = svg.append<SVGGElement>('g').attr('class', 'zoom-group');
      }

      const newElements = enrichElementData(newSvgString, metadata);
      if (!newElements || newElements.length === 0) return;

      // Data join par type d'élément avec vérification de sécurité
      const validElements = newElements.filter((el) => el && el.id);
      const selection = mainGroup
        .selectAll<SVGElement, ElementData>('[id]')
        .data(validElements, (d: ElementData) => d?.id || '');

      // EXIT: Suppression avec fade out
      selection
        .exit()
        .filter(function () {
          return this instanceof SVGElement;
        })
        .transition()
        .duration(transitionDuration * 0.3)
        .style('opacity', 0)
        .remove();

      // UPDATE: Animations différenciées par type
      const updateTransition = selection
        .transition()
        .duration((d: ElementData) => {
          // Durée variable selon le type
          switch (d.type) {
            case 'breaker':
            case 'disconnector':
              return transitionDuration * 0.8;
            case 'wire':
              return transitionDuration;
            case 'feeder':
              return transitionDuration * 1.2;
            default:
              return transitionDuration;
          }
        })
        .delay((d: ElementData) => d.priority * 50) // Délai échelonné
        .ease(d3.easeQuadInOut);

      // Animer les attributs principaux
      updateTransition
        .attr('transform', (d) => d.transform || null)
        .attr('fill', (d) => d.fill || null)
        .attr('stroke', (d) => d.stroke || null)
        .attr('class', (d) => d.className || null);

      // Animations spéciales pour les paths (wires)
      updateTransition
        .filter((d: ElementData) => d.d && d.type === 'wire')
        .attrTween('d', function (d: ElementData) {
          const element = this as SVGElement;
          const current = element.getAttribute('d') || d.d;
          return d3.interpolateString(current || '', d.d || '');
        });

      // Animations spéciales pour les breakers/disconnectors
      updateTransition
        .filter(
          (d: ElementData) => d.type === 'breaker' || d.type === 'disconnector',
        )
        .filter(function () {
          return this instanceof SVGElement;
        })
        .style('opacity', 0.6)
        .transition()
        .duration(200)
        .style('opacity', 1);

      // Animation des valeurs de puissance pour les feeders
      updateTransition
        .filter(
          (d: ElementData) =>
            d.type === 'feeder' &&
            (d.powerActive !== undefined || d.powerReactive !== undefined),
        )
        .tween('power', function (d: ElementData) {
          const element = d3.select(this);
          const textElement = element.select('text');

          if (textElement.empty()) return () => {};

          const currentValue = parseFloat(textElement.text()) || 0;
          const targetValue = d.powerActive || d.powerReactive || 0;
          const interpolator = d3.interpolateNumber(currentValue, targetValue);

          return function (t: number) {
            const value = Math.round(interpolator(t));
            textElement.text(value.toString());
          };
        });

      // ENTER: Nouveaux éléments avec fade in
      const enterSelection = selection
        .enter()
        .each(function (d: ElementData) {
          const importedNode = document.importNode(d.element, true);
          (this as Element).appendChild(importedNode);
        })
        .filter(function () {
          return this instanceof SVGElement;
        })
        .style('opacity', 0);

      enterSelection
        .transition()
        .duration(transitionDuration * 0.8)
        .delay((d: ElementData) => d.priority * 30)
        .ease(d3.easeQuadInOut)
        .style('opacity', 1);

      // Restaurer le zoom
      if (currentTransformRef.current) {
        mainGroup.attr('transform', currentTransformRef.current.toString());
      }
    },
    [svgRef, enrichElementData, transitionDuration],
  );

  // Initialisation du zoom dès le premier rendu
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    setupZoom(svg);

    // Cleanup au démontage
    return () => {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current).on('.zoom', null);
        zoomBehaviorRef.current = null;
      }
    };
  }, [setupZoom]);

  // Mise à jour automatique avec initialisation si nécessaire
  useEffect(() => {
    if (!diagramData?.svg || !svgRef.current) return;

    // Si c'est la première fois, initialiser le SVG
    if (!isInitializedRef.current) {
      initializeSvg(diagramData.svg);
    } else {
      // Sinon, utiliser le data join pour les mises à jour
      updateSvgWithDataJoin(diagramData.svg, diagramData.metadata);
    }
  }, [
    diagramData?.svg,
    diagramData?.metadata,
    initializeSvg,
    updateSvgWithDataJoin,
  ]);

  // Toggle breaker optimisé
  const toggleBreaker = useCallback(
    (breakerId: string, isClosed: boolean) => {
      if (!svgRef.current || !breakerId) return;

      const element = d3.select(svgRef.current).select(`#${breakerId}`);
      if (element.empty()) return;

      const node = element.node();
      if (!(node instanceof SVGElement)) return;

      // Animation de feedback immédiat
      element
        .transition()
        .duration(200)
        .style('opacity', 0.3)
        .transition()
        .duration(200)
        .style('opacity', 1)
        .on('start', () => {
          if (isClosed) {
            node.classList.remove('sld-closed');
            node.classList.add('sld-open');
          } else {
            node.classList.remove('sld-open');
            node.classList.add('sld-closed');
          }
        });
    },
    [svgRef],
  );

  const handleContextMenuTrigger = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const target = e.target as SVGElement;
      let element: SVGElement | null = target;

      // Recherche de l'élément parent avec ID
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
            className="w-full h-full cursor-default transition-transform duration-200"
            style={{ minHeight: '400px' }}
            onContextMenu={handleContextMenuTrigger}
          />
        </SVGContextMenu>
      </div>
    </div>
  );
};
