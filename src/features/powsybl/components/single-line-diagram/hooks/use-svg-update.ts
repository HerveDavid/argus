import React, { useEffect, RefObject, useCallback } from 'react';
import * as d3 from 'd3';
import { useDiagramStore } from '../../../stores/use-diagram.store';
import { TeleInformation } from '@/features/powsybl/types/tele-information.type';

/**
 * Hook to synchronize electrical diagram metadata with the SVG
 * Also handles updates for active power flow information
 */
export const useSvgUpdate = (
  svgContent: string | null,
  svgContainerRef: RefObject<HTMLDivElement>,
) => {
  // Get metadata from the store
  const metadata = useDiagramStore((state) => state.metadata);
  const previousMetadataRef = React.useRef<any>(null);

  /**
   * Function to update feeder information in the SVG
   * Currently only processes ARROW_ACTIVE values
   */
  const updateFeederInfo = useCallback(
    (id: string, value: number) => {
      if (!svgContainerRef.current) return;

      // Use d3 to select the SVG element
      const svg = d3.select(svgContainerRef.current).select('svg');
      if (svg.empty()) {
        console.warn('SVG not found in container');
        return;
      }

      // Check that it's an ARROW_ACTIVE type element
      if (!id.includes('ARROW_ACTIVE')) {
        console.warn('Only ARROW_ACTIVE elements are currently supported');
        return;
      }

      // Select the feeder group element
      const feederGroup = svg.select(`#${id}`);
      if (feederGroup.empty()) {
        console.warn(`Element with ID ${id} not found in SVG`);
        return;
      }

      // Select the text element in the group
      const textElement = feederGroup.select('.sld-label');
      if (textElement.empty()) {
        console.warn(`Text element not found in feeder ${id}`);
        return;
      }

      // Update the value while preserving the MW unit
      const text = `${value} MW`;
      textElement.text(text);

      // Add a small animation to highlight the update
      textElement
        .style('fill', 'red')
        .transition()
        .duration(1000)
        .style('fill', 'black');

      console.log(`Updated ${id} with value: ${value} MW`);
    },
    [svgContainerRef],
  );

  // Function to process update messages
  const handleUpdateMessage = useCallback(
    (message: TeleInformation) => {
      // Only process TM (telemetry) type messages
      if (message.ti === 'TM' && message.data.id.includes('ARROW_ACTIVE')) {
        updateFeederInfo(message.data.id, message.data.value);
      }
    },
    [updateFeederInfo],
  );

  useEffect(() => {
    if (!svgContent || !svgContainerRef.current || !metadata) return;

    // Use d3 to access the SVG
    const svg = d3.select(svgContainerRef.current).select('svg');
    if (svg.empty()) return;

    // Avoid unnecessary updates if metadata hasn't changed
    if (metadata === previousMetadataRef.current) return;
    previousMetadataRef.current = metadata;

    // Add interactions to the SVG
    svg
      .style('cursor', 'pointer')
      .on('mouseover', function (event) {
        // Get the hovered element
        const target = d3.select(event.target);

        // If it's an element with an ID, we can add a visual effect
        if (
          target.attr('id') &&
          (target.classed('sld-breaker') ||
            target.classed('sld-disconnector') ||
            target.classed('sld-load') ||
            target.classed('sld-generator'))
        ) {
          target.style('stroke-width', function () {
            // Increase the outline thickness
            const currentWidth = parseFloat(
              target.style('stroke-width') || '1',
            );
            return `${currentWidth * 1.5}px`;
          });
        }
      })
      .on('mouseout', function (event) {
        // Reset the hover style
        const target = d3.select(event.target);
        if (target.attr('id')) {
          target.style('stroke-width', null);
        }
      });
  }, [svgContent, svgContainerRef, metadata]);

  return {
    handleUpdateMessage,
  };
};
