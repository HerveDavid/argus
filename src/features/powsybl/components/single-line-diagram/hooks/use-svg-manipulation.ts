import { useEffect, RefObject } from 'react';
import * as d3 from 'd3';

export const useSvgManipulation = (
  svgContent: string | null,
  svgContainerRef: RefObject<HTMLDivElement>,
) => {
  useEffect(() => {}, [svgContent, svgContainerRef]);
};
