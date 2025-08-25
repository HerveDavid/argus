import * as d3 from 'd3';
import React, { useCallback } from 'react';
import { toast } from 'sonner';

interface FeederUpdate {
  id: string;
  value: number;
}

interface UseUpdateFeedersProps {
  svgContainerRef: React.RefObject<HTMLDivElement>;
}

export const useUpdateFeeders = ({ svgContainerRef }: UseUpdateFeedersProps) => {
  /**
   * Met à jour un feeder spécifique par son ID
   */
  const updateFeeder = useCallback(
    (id: string, value: number) => {
      if (!svgContainerRef.current) return false;
      if (id === "") return false;

      // Utiliser d3 pour sélectionner l'élément SVG dans le conteneur
      const svg = d3.select(svgContainerRef.current).select('svg');
      
      if (svg.empty()) {
        console.warn('SVG non trouvé dans le conteneur');
        return false;
      }

      // Sélectionner l'élément du SVG
      const svgElement = svg.select(`#${id}`);
      
      if (svgElement.empty()) {
        console.warn(`Élément avec l'ID ${id} non trouvé dans le SVG`);
        return false;
      }

      // Element de type feeder avec une balise sld-label contenant la valeur
      const textElement = svgElement.select('.sld-label');
      
      if (!textElement.empty()) {
        // Mettre à jour la valeur en conservant l'unité
        // Seulement 4 décimales
        const formattedValue = parseFloat(value.toFixed(4));
        textElement.text(formattedValue.toString());

        // Gérer les classes sld-in et sld-out en fonction du signe de la valeur
        if (value >= 1e-4) {
          // Valeur positive: ajouter sld-out et retirer sld-in
          svgElement.classed('sld-out', true);
          svgElement.classed('sld-in', false);
        } else if (value <= -1e-4) {
          // Valeur négative: ajouter sld-in et retirer sld-out
          svgElement.classed('sld-in', true);
          svgElement.classed('sld-out', false);
        } else {
          // Valeur nulle: retirer les deux classes
          svgElement.classed('sld-in', false);
          svgElement.classed('sld-out', false);
        }

        // Ajouter une petite animation pour mettre en évidence la mise à jour
        textElement
          .style('fill', 'red')
          .transition()
          .duration(1000)
          .style('fill', 'black');

        return true;
      } else if (svgElement.classed('sld-open') || svgElement.classed('sld-closed')) {
        // Breaker element
        const valueInt = parseInt(value.toFixed(0));
        
        if (svgElement.classed('sld-switching')) {
          console.log("element switching: ", id);
        }
        
        if (valueInt === 1 && svgElement.classed('sld-open') && svgElement.classed('sld-switching')) {
          console.log("fin switching open", id);
          svgElement.classed('sld-switching', false);
        } else if (valueInt === 2 && svgElement.classed('sld-closed') && svgElement.classed('sld-switching')) {
          console.log("fin switching close", id);
          svgElement.classed('sld-switching', false);
        } else if (valueInt === 1 && svgElement.classed('sld-closed') && !svgElement.classed('sld-switching')) {
          svgElement.classed('sld-open', true);
          svgElement.classed('sld-closed', false);
          console.log("open switch ", id);
        } else if (valueInt === 2 && svgElement.classed('sld-open') && !svgElement.classed('sld-switching')) {
          svgElement.classed('sld-open', false);
          svgElement.classed('sld-closed', true);
          console.log("close switch ", id);
        }
        
        return true;
      } else {
        console.warn(`Element not managed: ${id}`);
        return false;
      }
    },
    [svgContainerRef],
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
        toast(`Failed feeders update: ${failures.join(', ')}`);
      }

      return { successCount, total: updates.length, failures };
    },
    [updateFeeder],
  );

  /**
   * Récupère tous les feeders disponibles dans le SVG
   */
  const getAllFeeders = useCallback(() => {
    if (!svgContainerRef.current) return [];

    const svg = d3.select(svgContainerRef.current).select('svg');
    
    if (svg.empty()) {
      console.warn('SVG non trouvé dans le conteneur');
      return [];
    }

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
  }, [svgContainerRef]);

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

      // Générer des valeurs aléatoires à chaque appel
      const randomFactor = Math.random();

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
  }, [getAllFeeders]);

  /**
   * Met à jour TOUS les feeders avec des valeurs aléatoires
   */
  const updateAllFeeders = useCallback(() => {
    const feeders = getAllFeeders();

    if (feeders.length === 0) {
      console.warn('Aucun feeder trouvé dans le SVG');
      return { successCount: 0, total: 0, failures: [] };
    }

    // Générer des valeurs nouvelles à chaque fois
    const mockData = feeders.map((feeder) => {
      const randomValue = Math.random();
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

    console.log(`Generated ${mockData.length} fresh random values`);
    return updateMultipleFeeders(mockData);
  }, [getAllFeeders, updateMultipleFeeders]);

  /**
   * Fonction de debug pour inspecter le contenu du SVG
   */
  const debugSvgContent = useCallback(() => {
    if (!svgContainerRef.current) {
      console.log('svgContainerRef non disponible');
      return;
    }

    const svg = d3.select(svgContainerRef.current).select('svg');
    
    if (svg.empty()) {
      console.log('SVG non trouvé dans le conteneur');
      return;
    }

    console.log('=== DEBUG SVG CONTENT ===');
    console.log('Éléments avec sld-feeder-info:', svg.selectAll('.sld-feeder-info').size());
    console.log('Éléments avec sld-active-power:', svg.selectAll('.sld-active-power').size());
    console.log('Éléments avec sld-reactive-power:', svg.selectAll('.sld-reactive-power').size());
    console.log('Éléments avec sld-label:', svg.selectAll('.sld-label').size());
    
    // Lister les premiers IDs trouvés
    let count = 0;
    svg.selectAll('[id]').each(function() {
      if (count < 10) {
        const element = d3.select(this);
        console.log('ID trouvé:', element.attr('id'), 'Classes:', element.attr('class'));
        count++;
      }
    });
    
    if (count >= 10) {
      console.log('... et plus encore');
    }
  }, [svgContainerRef]);

  /**
   * Test avec un ID spécifique
   */
  const testSpecificId = useCallback((id: string) => {
    if (!svgContainerRef.current) {
      console.log('svgContainerRef non disponible');
      return;
    }

    const svg = d3.select(svgContainerRef.current).select('svg');
    
    if (svg.empty()) {
      console.log('SVG non trouvé dans le conteneur');
      return;
    }

    console.log(`=== TEST ID: ${id} ===`);
    const element = svg.select(`#${id}`);
    
    if (element.empty()) {
      console.log('Élément non trouvé');
    } else {
      console.log('Élément trouvé!');
      console.log('Classes:', element.attr('class'));
      
      const textElement = element.select('.sld-label');
      if (!textElement.empty()) {
        console.log('Valeur actuelle:', textElement.text());
      } else {
        console.log('Aucun .sld-label trouvé');
      }
      
      // Lister tous les enfants
      element.selectAll('*').each(function() {
        const child = d3.select(this);
        console.log('Enfant:', child.node().tagName, 'classe:', child.attr('class'), 'texte:', child.text());
      });
    }
  }, [svgContainerRef]);

  return {
    updateFeeder,
    updateMultipleFeeders,
    generateMockData,
    getAllFeeders,
    updateAllFeeders,
    debugSvgContent,
    testSpecificId,
  };
};