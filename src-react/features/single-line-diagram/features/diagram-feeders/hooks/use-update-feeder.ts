import { scadaUpdateFeedersAtom } from '@/features/single-line-diagram/providers/diagram.provider/atoms';
import { SldMetadata } from '@/types/sld-metadata';
import { useAtom } from '@effect-atom/atom-react';
import * as d3 from 'd3';
import React, { useCallback, useEffect, useRef } from 'react';

interface FeederUpdaterProps {
  metadata: SldMetadata;
  svgRef: React.RefObject<SVGSVGElement>;
}

export const useFeederUpdater = ({ metadata, svgRef }: FeederUpdaterProps) => {
  const [outputs, setOutputs] = useAtom(scadaUpdateFeedersAtom);
  const updateCountRef = useRef(0);
  const isSubscribedRef = useRef(false);

  // Fonction updateFeeder stable qui ne change pas à chaque render
  const updateFeeder = useCallback(
    (id: string, value: number) => {
      console.log(`🔍 updateFeeder called - ID: ${id}, Value: ${value}`);

      if (!svgRef.current) {
        console.warn('❌ SVG ref is null');
        return false;
      }

      if (!id) {
        console.warn('❌ ID is empty');
        return false;
      }

      console.log('✅ SVG ref available, searching for element...');

      const svg = d3.select(svgRef.current);
      const element = svg.select(`#${id}`);

      if (element.empty()) {
        console.warn(`❌ Element with ID ${id} not found in SVG`);
        // Debug: lister les IDs disponibles
        const availableIds: string[] = [];
        svg.selectAll('[id]').each(function () {
          const currentId = d3.select(this).attr('id');
          if (currentId) availableIds.push(currentId);
        });
        console.log('Available IDs in SVG:', availableIds.slice(0, 10)); // Premier 10 pour éviter le spam
        return false;
      }

      console.log(`✅ Found element ${id}, looking for .sld-label...`);

      const textElement = element.select('.sld-label');
      if (textElement.empty()) {
        console.warn(`❌ No .sld-label found in element ${id}`);
        // Debug: voir les classes disponibles
        const classes = element.attr('class');
        console.log(`Element classes: ${classes}`);
        return false;
      }

      console.log(`✅ Found .sld-label, updating text to ${value}...`);

      const formattedValue = parseFloat(value.toFixed(4));
      textElement.text(formattedValue.toString());

      // Mise à jour des classes
      if (value >= 1e-4) {
        element.classed('sld-out', true);
        element.classed('sld-in', false);
        console.log(`🟢 Applied sld-out class to ${id}`);
      } else if (value <= -1e-4) {
        element.classed('sld-in', true);
        element.classed('sld-out', false);
        console.log(`🔴 Applied sld-in class to ${id}`);
      } else {
        element.classed('sld-in', false);
        element.classed('sld-out', false);
        console.log(`⚪ Removed flow classes from ${id}`);
      }

      // Animation
      textElement
        .style('fill', 'red')
        .transition()
        .duration(1000)
        .style('fill', 'black');

      console.log(
        `✅ Successfully updated feeder ${id} with value ${formattedValue}`,
      );
      return true;
    },
    [svgRef],
  );

  const updateMultipleFeeders = useCallback(
    (updates: Array<{ id: string; value: number }>) => {
      const results = updates.map(({ id, value }) => updateFeeder(id, value));
      return results.every((result) => result);
    },
    [updateFeeder],
  );

  const getFeederValue = useCallback((id: string): string | null => {
    if (!svgRef.current) return null;

    const svgElement = d3.select(svgRef.current);

    const possibleSelectors = [
      `#id${id}_ARROW_ACTIVE .sld-label`,
      `#id${id}_ARROW_REACTIVE .sld-label`,
      `#${id}_ARROW_ACTIVE .sld-label`,
      `#${id}_ARROW_REACTIVE .sld-label`,
      `[id*="${id}"] .sld-label`,
    ];

    for (const selector of possibleSelectors) {
      const element = svgElement.select(selector);
      if (!element.empty()) {
        return element.text();
      }
    }

    return null;
  }, []);

  const getAllFeederIds = useCallback((): string[] => {
    if (!svgRef.current) return [];

    const svgElement = d3.select(svgRef.current);
    const feederElements = svgElement.selectAll('.sld-feeder-info');

    const ids: string[] = [];
    feederElements.each(function () {
      const element = d3.select(this);
      const id = element.attr('id');
      if (id) {
        const match = id.match(/id(.+?)_ARROW_(ACTIVE|REACTIVE)/);
        if (match) {
          const baseId = match[1];
          if (!ids.includes(baseId)) {
            ids.push(baseId);
          }
        }
      }
    });

    return ids;
  }, []);

  const resetAllFeeders = useCallback((resetValue: string = '****') => {
    if (!svgRef.current) return false;

    const svgElement = d3.select(svgRef.current);
    const feederLabels = svgElement.selectAll('.sld-feeder-info .sld-label');

    if (feederLabels.empty()) return false;

    feederLabels.text(resetValue);
    updateCountRef.current++;
    return true;
  }, []);

  // Effect pour démarrer la souscription SCADA
  useEffect(() => {
    // Attendre que le SVG soit monté et que les metadata soient disponibles
    if (!svgRef.current || !metadata || isSubscribedRef.current) {
      return;
    }

    // Vérifier qu'il y a des feeders dans le SVG avant de s'abonner
    const feederElements = d3
      .select(svgRef.current)
      .selectAll('.sld-feeder-info');
    if (feederElements.empty()) {
      console.warn('No feeder elements found in SVG');
      return;
    }

    console.log('Starting SCADA subscription for metadata:', metadata);

    try {
      setOutputs({
        metadata,
        update: updateFeeder,
      });

      isSubscribedRef.current = true;
    } catch (error) {
      console.error('Error starting SCADA subscription:', error);
    }

    // Cleanup lors du démontage ou changement de metadata
    return () => {
      isSubscribedRef.current = false;
      console.log('Cleaning up SCADA subscription');
    };
  }, [metadata, setOutputs, updateFeeder]); // Toutes les dépendances

  // Reset de la souscription si metadata change
  useEffect(() => {
    isSubscribedRef.current = false;
  }, [metadata]);

  return {
    updateFeeder,
    updateMultipleFeeders,
    getFeederValue,
    getAllFeederIds,
    resetAllFeeders,
    updateCount: updateCountRef.current,
    isSubscribed: isSubscribedRef.current,
  };
};
