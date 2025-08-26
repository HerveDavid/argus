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

  const formattedValue = parseFloat(value.toFixed(4));
  textElement.text(formattedValue.toString());

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
