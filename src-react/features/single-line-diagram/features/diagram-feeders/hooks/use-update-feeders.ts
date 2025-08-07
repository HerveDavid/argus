import * as d3 from 'd3';
import React, { useCallback } from 'react';
import { toast } from 'sonner';

interface FeederUpdate {
  id: string;
  value: number;
}

interface UseUpdateFeedersProps {
  svgRef: React.RefObject<SVGSVGElement>;
}

export const useUpdateFeeders = ({ svgRef }: UseUpdateFeedersProps) => {
  /**
   * Met à jour un feeder spécifique par son ID
   */
  const updateFeeder = useCallback(
    (id: string, value: number) => {
      if (!svgRef.current || !id) return false;

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

      textElement
        .style('fill', 'red')
        .transition()
        .duration(1000)
        .style('fill', 'black');

      return true;
    },
    [svgRef],
  );

  /**
   * Met à jour plusieurs feeders
   */
  const updateMultipleFeeders = useCallback(
    (updates: FeederUpdate[]) => {
      let successCount = 0;
      const failures: string[] = [];

      updates.forEach((update) => {
        const success = updateFeeder(update.id, update.value);
        if (success) {
          successCount++;
        } else {
          failures.push(update.id);
        }
      });

      if (failures.length > 0) {
        toast(`Failed feeders update: ` + failures);
      }

      return { successCount, total: updates.length, failures };
    },
    [updateFeeder],
  );

  /**
   * Récupère tous les feeders disponibles dans le SVG
   */
  const getAllFeeders = useCallback(() => {
    if (!svgRef.current) return [];

    const svg = d3.select(svgRef.current);
    const feeders: { id: string; type: string; currentValue: string }[] = [];

    // Sélectionner tous les éléments avec la classe sld-feeder-info
    svg.selectAll('.sld-feeder-info').each(function () {
      const element = d3.select(this);
      const id = element.attr('id');
      const textElement = element.select('.sld-label');

      if (id && !textElement.empty()) {
        let type = 'unknown';
        if (element.classed('sld-active-power')) type = 'active-power';
        else if (element.classed('sld-reactive-power')) type = 'reactive-power';
        else if (element.classed('sld-current')) type = 'current';

        feeders.push({
          id,
          type,
          currentValue: textElement.text(),
        });
      }
    });

    return feeders;
  }, [svgRef]);

  /**
   * Génère des données mockées basées sur les feeders réels du SVG
   */
  const generateMockData = useCallback((): FeederUpdate[] => {
    const feeders = getAllFeeders();

    if (feeders.length === 0) {
      console.warn('Aucun feeder trouvé dans le SVG');
      return [];
    }

    return feeders.map((feeder) => {
      let value: number;

      // Générer des valeurs VRAIMENT aléatoires à chaque appel
      const randomFactor = Math.random(); // Nouveau random à chaque fois

      if (feeder.type === 'active-power') {
        // Valeurs entre -100 et +100 MW
        value = -100 + randomFactor * 200;
      } else if (feeder.type === 'reactive-power') {
        // Valeurs entre -50 et +50 MVAR
        value = -50 + randomFactor * 100;
      } else {
        // Valeurs entre 0 et 1500 A pour le courant
        value = randomFactor * 1500;
      }

      return {
        id: feeder.id,
        value: parseFloat(value.toFixed(2)),
      };
    });
  }, [getAllFeeders]); // ❌ ENLEVÉ la dépendance qui causait la mise en cache

  /**
   * Met à jour TOUS les feeders avec des valeurs aléatoires FRAÎCHES
   */
  const updateAllFeeders = useCallback(() => {
    // Générer des nouvelles données à chaque appel (pas de cache)
    const feeders = getAllFeeders();

    if (feeders.length === 0) {
      console.warn('Aucun feeder trouvé dans le SVG');
      return { successCount: 0, total: 0, failures: [] };
    }

    // Générer des valeurs VRAIMENT nouvelles à chaque fois
    const mockData = feeders.map((feeder) => {
      const randomValue = Math.random(); // Nouveau random à chaque itération
      let value: number;

      if (feeder.type === 'active-power') {
        value = -100 + randomValue * 200; // -100 à +100 MW
      } else if (feeder.type === 'reactive-power') {
        value = -50 + randomValue * 100; // -50 à +50 MVAR
      } else {
        value = randomValue * 1500; // 0 à 1500 A
      }

      return {
        id: feeder.id,
        value: parseFloat(value.toFixed(2)),
      };
    });

    console.log(`🎲 Generated ${mockData.length} fresh random values`);
    return updateMultipleFeeders(mockData);
  }, [getAllFeeders, updateMultipleFeeders]);

  return {
    updateFeeder,
    updateMultipleFeeders,
    generateMockData,
    getAllFeeders,
    updateAllFeeders,
  };
};
