import { useCallback, useRef } from 'react';
import * as d3 from 'd3';
import { SldMetadata } from '@/types/sld-metadata';
import { ElementData } from '../../../types';
import {
  parseSvgString,
  validateSvgElement,
  extractViewBox,
} from '../utils/svg-parser';
import { enrichElementsWithMetadata } from '../utils/element-data-processor';
import {
  getElementSignature,
  createElementMaps,
  removeObsoleteElements,
  addNewElement,
  updateExistingElement,
} from '../utils/element-updater';

export const useSvgManager = (svgRef: React.RefObject<SVGSVGElement>) => {
  const isInitializedRef = useRef(false);
  const lastSvgStringRef = useRef<string>('');
  const elementsDataRef = useRef<Map<string, ElementData>>(new Map());

  const ensureZoomGroup = useCallback(
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

  const initializeSvg = useCallback(
    async (svgString: string) => {
      if (!svgRef.current || !svgString?.trim()) return;

      const doc = parseSvgString(svgString);
      if (!doc) return;

      const svgElement = validateSvgElement(doc);
      if (!svgElement) return;

      const svg = d3.select(svgRef.current);

      // Configuration des dimensions
      const viewBox = extractViewBox(svgElement);
      if (viewBox) {
        svg.attr('viewBox', viewBox);
      }

      // Import du contenu
      svg.node()!.innerHTML = svgElement.innerHTML;
      svg.attr('width', '100%').attr('height', '100%');

      lastSvgStringRef.current = svgString;
      isInitializedRef.current = true;
    },
    [svgRef],
  );

  const updateSvg = useCallback(
    (
      newSvgString: string,
      metadata?: SldMetadata,
      restoreTransformFn?: () => void,
    ) => {
      if (!svgRef.current || !newSvgString?.trim()) return;
      if (newSvgString === lastSvgStringRef.current) return;

      const svg = d3.select(svgRef.current);
      const mainGroup = ensureZoomGroup(svg);

      const newElements = enrichElementsWithMetadata(newSvgString, metadata);
      if (!newElements || newElements.length === 0) return;

      const newElementsMap = new Map<string, ElementData>();
      newElements.forEach((el) => newElementsMap.set(el.id, el));

      const existingElementsMap = createElementMaps(mainGroup, newElementsMap);

      // Supprimer les éléments obsolètes
      removeObsoleteElements(mainGroup, newElementsMap);

      // Traiter chaque élément
      newElements.forEach((newData) => {
        const existing = existingElementsMap.get(newData.id);
        const newSignature = getElementSignature(newData);

        if (!existing) {
          addNewElement(mainGroup, newData);
        } else if (existing.signature !== newSignature) {
          updateExistingElement(existing.element, newData);
        }
      });

      // Restaurer le zoom
      restoreTransformFn?.();

      // Mettre à jour les références
      lastSvgStringRef.current = newSvgString;
      elementsDataRef.current.clear();
      newElements.forEach((el) => elementsDataRef.current.set(el.id, el));
    },
    [svgRef, ensureZoomGroup],
  );

  return {
    isInitialized: isInitializedRef.current,
    initializeSvg,
    updateSvg,
    ensureZoomGroup,
  };
};
