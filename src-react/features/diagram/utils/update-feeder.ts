import * as d3 from 'd3';
import React from 'react';

export const updateFeeder = (
  svgRef: React.RefObject<SVGSVGElement>,
  id: string,
  value: number,
): boolean => {
  if (!svgRef.current || !id) {
    return false;
  }

  const svg = d3.select(svgRef.current);
  const element = svg.select(`#${id}`);

  if (element.empty()) {
    return false;
  }

  const textElement = element.select('.sld-label');
  if (textElement.empty()) {
    return false;
  }

  // Affichage conditionnel basé sur la valeur
  let displayText: string;
  if (value === 0) {
    displayText = '*****';
  } else {
    const formattedValue = parseFloat(value.toFixed(4));
    displayText = formattedValue.toString();
  }

  textElement.text(displayText);

  // Mise à jour des classes
  if (value >= 1e-4) {
    element.classed('sld-out', true);
    element.classed('sld-in', false);
  } else if (value <= -1e-4) {
    element.classed('sld-in', true);
    element.classed('sld-out', false);
  } else {
    element.classed('sld-in', false);
    element.classed('sld-out', false);
  }

  // Animation
  textElement
    .style('fill', 'red')
    .transition()
    .duration(1000)
    .style('fill', 'black');

  return true;
};

type D3Element = d3.Selection<Element, unknown, null, undefined>;
type D3TextElement = d3.Selection<Element, unknown, null, undefined>;

export const updateFeedersBatch = (
  svgRef: React.RefObject<SVGSVGElement>,
  feeders: Array<readonly [string, number]>,
): { success: number; failed: number } => {
  if (!svgRef.current || feeders.length === 0) {
    return { success: 0, failed: feeders.length };
  }

  const svg = d3.select(svgRef.current);
  let success = 0;

  // Créer un Map pour O(1) lookup au lieu de O(n)
  const feederMap = new Map(feeders);

  const updatedTextElements: D3TextElement[] = [];

  // Une seule traversée du DOM avec typage correct
  const allElementsWithId = svg.selectAll<Element, unknown>('[id]');

  allElementsWithId.each(function (this: Element) {
    const element: D3Element = d3.select(this);
    const id = element.attr('id');

    // Vérification TypeScript-safe
    if (!id || !feederMap.has(id)) {
      return;
    }

    const value = feederMap.get(id)!;
    const textElement: D3TextElement = element.select('.sld-label');

    // Vérifier que le textElement existe
    if (textElement.empty()) {
      return;
    }

    // Affichage conditionnel basé sur la valeur
    let displayText: string;
    if (value === 0) {
      displayText = '*****';
    } else {
      const formattedValue = parseFloat(value.toFixed(4));
      displayText = formattedValue.toString();
    }

    textElement.text(displayText);

    // Mise à jour des classes de manière optimisée
    const isOut = value >= 1e-4;
    const isIn = value <= -1e-4;

    element.classed('sld-out', isOut).classed('sld-in', isIn && !isOut);

    // Collecter pour animation batch
    updatedTextElements.push(textElement);
    success++;
  });

  // Animation batch synchronisée
  if (updatedTextElements.length > 0) {
    // Appliquer le style initial à tous
    updatedTextElements.forEach((textElement) => {
      textElement.style('fill', 'red');
    });

    // Créer une seule transition pour tous
    const transition = d3.transition().duration(500);

    updatedTextElements.forEach((textElement) => {
      textElement.transition(transition).style('fill', 'black');
    });
  }

  const result = { success, failed: feeders.length - success };

  return result;
};
