import * as d3 from 'd3';
import React from 'react';

export const updateFeeder = (
  svgRef: React.RefObject<SVGSVGElement>,
  id: string,
  value: number,
): boolean => {
  console.log(`🔄 updateFeeder appelé - ID: ${id}, Value: ${value}`);

  if (!svgRef.current || !id) {
    console.warn(`⚠️ updateFeeder - Conditions invalides:`, {
      svgExists: !!svgRef.current,
      idValid: !!id,
    });
    return false;
  }

  const svg = d3.select(svgRef.current);
  const element = svg.select(`#${id}`);

  if (element.empty()) {
    console.warn(`⚠️ updateFeeder - Élément non trouvé pour ID: ${id}`);
    return false;
  }

  const textElement = element.select('.sld-label');
  if (textElement.empty()) {
    console.warn(
      `⚠️ updateFeeder - Élément texte (.sld-label) non trouvé pour ID: ${id}`,
    );
    return false;
  }

  const formattedValue = parseFloat(value.toFixed(4));
  console.log(
    `📝 updateFeeder - Mise à jour texte ID ${id}: ${formattedValue}`,
  );
  textElement.text(formattedValue.toString());

  // Mise à jour des classes
  let classUpdate = '';
  if (value >= 1e-4) {
    element.classed('sld-out', true);
    element.classed('sld-in', false);
    classUpdate = 'sld-out';
  } else if (value <= -1e-4) {
    element.classed('sld-in', true);
    element.classed('sld-out', false);
    classUpdate = 'sld-in';
  } else {
    element.classed('sld-in', false);
    element.classed('sld-out', false);
    classUpdate = 'none';
  }

  console.log(`🎨 updateFeeder - Classe appliquée ID ${id}: ${classUpdate}`);

  // Animation
  console.log(`✨ updateFeeder - Démarrage animation pour ID: ${id}`);
  textElement
    .style('fill', 'red')
    .transition()
    .duration(1000)
    .style('fill', 'black');

  console.log(`✅ updateFeeder - Succès pour ID: ${id}`);
  return true;
};

type D3Element = d3.Selection<Element, unknown, null, undefined>;
type D3TextElement = d3.Selection<Element, unknown, null, undefined>;

export const updateFeedersBatch = (
  svgRef: React.RefObject<SVGSVGElement>,
  feeders: Array<readonly [string, number]>,
): { success: number; failed: number } => {
  console.log(
    `🚀 updateFeedersBatch appelé avec ${feeders.length} feeders:`,
    feeders,
  );

  if (!svgRef.current || feeders.length === 0) {
    console.warn(`⚠️ updateFeedersBatch - Conditions invalides:`, {
      svgExists: !!svgRef.current,
      feedersLength: feeders.length,
    });
    return { success: 0, failed: feeders.length };
  }

  const svg = d3.select(svgRef.current);
  let success = 0;

  // Créer un Map pour O(1) lookup au lieu de O(n)
  const feederMap = new Map(feeders);
  console.log(
    `📋 updateFeedersBatch - Map créée:`,
    Array.from(feederMap.keys()),
  );

  const updatedTextElements: D3TextElement[] = [];

  // Compter les éléments avec ID dans le DOM
  const allElementsWithId = svg.selectAll<Element, unknown>('[id]');
  const totalElementsCount = allElementsWithId.size();
  console.log(
    `🔍 updateFeedersBatch - ${totalElementsCount} éléments avec ID trouvés dans le SVG`,
  );

  // Une seule traversée du DOM avec typage correct
  allElementsWithId.each(function (this: Element) {
    const element: D3Element = d3.select(this);
    const id = element.attr('id');

    // Vérification TypeScript-safe
    if (!id || !feederMap.has(id)) {
      return;
    }

    console.log(`🎯 updateFeedersBatch - Traitement de l'élément ID: ${id}`);

    const value = feederMap.get(id)!;
    const textElement: D3TextElement = element.select('.sld-label');

    // Vérifier que le textElement existe
    if (textElement.empty()) {
      console.warn(
        `⚠️ updateFeedersBatch - Élément texte (.sld-label) non trouvé pour ID: ${id}`,
      );
      return;
    }

    // Mise à jour de la valeur
    const formattedValue = parseFloat(value.toFixed(4));
    console.log(
      `📝 updateFeedersBatch - Mise à jour texte ID ${id}: ${formattedValue} (valeur brute: ${value})`,
    );
    textElement.text(formattedValue.toString());

    // Mise à jour des classes de manière optimisée
    const isOut = value >= 1e-4;
    const isIn = value <= -1e-4;

    element.classed('sld-out', isOut).classed('sld-in', isIn && !isOut);

    const appliedClass = isOut ? 'sld-out' : isIn ? 'sld-in' : 'none';
    console.log(
      `🎨 updateFeedersBatch - Classe appliquée ID ${id}: ${appliedClass}`,
    );

    // Collecter pour animation batch
    updatedTextElements.push(textElement);
    success++;
    console.log(
      `✅ updateFeedersBatch - Succès pour ID: ${id} (total succès: ${success})`,
    );
  });

  console.log(`📊 updateFeedersBatch - Résultats intermédiaires:`, {
    elementsToUpdate: updatedTextElements.length,
    successCount: success,
    totalFeeders: feeders.length,
  });

  // Animation batch synchronisée
  if (updatedTextElements.length > 0) {
    console.log(
      `✨ updateFeedersBatch - Démarrage animation batch pour ${updatedTextElements.length} éléments`,
    );

    // Appliquer le style initial à tous
    updatedTextElements.forEach((textElement, index) => {
      console.log(
        `🔴 updateFeedersBatch - Application fill rouge pour élément ${index + 1}/${updatedTextElements.length}`,
      );
      textElement.style('fill', 'red');
    });

    // Créer une seule transition pour tous
    const transition = d3.transition().duration(500);
    console.log(`⏱️ updateFeedersBatch - Transition créée (durée: 500ms)`);

    updatedTextElements.forEach((textElement, index) => {
      console.log(
        `⚫ updateFeedersBatch - Application transition vers noir pour élément ${index + 1}/${updatedTextElements.length}`,
      );
      textElement.transition(transition).style('fill', 'black');
    });

    console.log(`✨ updateFeedersBatch - Toutes les animations lancées`);
  } else {
    console.warn(`⚠️ updateFeedersBatch - Aucun élément à animer`);
  }

  const result = { success, failed: feeders.length - success };
  console.log(`🏁 updateFeedersBatch - Résultat final:`, result);

  return result;
};
