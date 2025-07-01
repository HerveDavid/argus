import * as d3 from 'd3';
import { ElementData } from '../../../types';

export const getElementSignature = (data: ElementData): string => {
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
};

export const createElementMaps = (
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  newElementsMap: Map<string, ElementData>
) => {
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

  return existingElementsMap;
};

export const removeObsoleteElements = (
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  newElementsMap: Map<string, ElementData>
) => {
  mainGroup.selectAll<SVGElement, unknown>('[id]').each(function () {
    const element = this as SVGElement;
    if (element.id && !newElementsMap.has(element.id)) {
      element.remove();
    }
  });
};

const applyElementAttributes = (element: SVGElement, data: ElementData) => {
  if (data.transform) element.setAttribute('transform', data.transform);
  if (data.fill) element.setAttribute('fill', data.fill);
  if (data.stroke) element.setAttribute('stroke', data.stroke);
  if (data.className) element.setAttribute('class', data.className);
  if (data.d) element.setAttribute('d', data.d);
};

export const addNewElement = (
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: ElementData
) => {
  const importedNode = document.importNode(data.element, true) as SVGElement;
  applyElementAttributes(importedNode, data);
  importedNode.style.opacity = '1';
  mainGroup.node()?.appendChild(importedNode);
};

export const updateExistingElement = (element: SVGElement, data: ElementData) => {
  applyElementAttributes(element, data);

  // Mise à jour du texte pour les feeders
  if (
    data.type === 'feeder' &&
    (data.powerActive !== undefined || data.powerReactive !== undefined)
  ) {
    const textElement = element.querySelector('text');
    if (textElement) {
      const targetValue = data.powerActive || data.powerReactive || 0;
      textElement.textContent = targetValue.toString();
    }
  }

  // État des breakers/disconnectors
  if ((data.type === 'breaker' || data.type === 'disconnector') && data.isOpen !== undefined) {
    if (data.isOpen) {
      element.classList.remove('sld-closed');
      element.classList.add('sld-open');
    } else {
      element.classList.remove('sld-open');
      element.classList.add('sld-closed');
    }
  }
};