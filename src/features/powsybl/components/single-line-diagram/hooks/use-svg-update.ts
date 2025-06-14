import React, { useEffect, RefObject, useCallback } from 'react';
import * as d3 from 'd3';
import { useDiagramStore } from '../../../stores/use-diagram.store';
import { TeleInformation } from '@/features/powsybl/types/tele-information.type';

/**
 * Hook pour synchroniser les métadonnées du diagramme électrique avec le SVG
 * Gère également les mises à jour des informations de flux de puissance active
 */
export const useSvgUpdate = (
  svgContent: string | null,
  svgContainerRef: RefObject<HTMLDivElement>,
) => {
  // Récupérer les métadonnées depuis le store
  const metadata = useDiagramStore((state) => state.metadata);
  const previousMetadataRef = React.useRef<any>(null);

  /**
   * Fonction pour initialiser les valeurs par défaut des feeders
   */
  const initializeFeederValues = useCallback(() => {
    if (!svgContainerRef.current) return;

    // Utiliser d3 pour sélectionner l'élément SVG
    const svg = d3.select(svgContainerRef.current).select('svg');
    if (svg.empty()) {
      console.warn('SVG non trouvé dans le conteneur');
      return;
    }

    // Sélectionner tous les éléments text à l'intérieur des groupes avec la classe sld-feeder-info
    const feederInfoTextElements = svg.selectAll('.sld-feeder-info .sld-label');

    if (feederInfoTextElements.empty()) {
      console.warn(
        'Aucun élément texte trouvé dans les groupes sld-feeder-info',
      );
      return;
    }

    // Mettre la valeur par défaut "****" pour tous les éléments texte
    feederInfoTextElements.text('****');

    console.log(
      `Initialisation de ${feederInfoTextElements.size()} éléments feeder-info avec la valeur par défaut "****"`,
    );
  }, [svgContainerRef]);

  /**
   * Fonction pour mettre à jour les informations d'un feeder dans le SVG
   * Pour l'instant, ne traite que les valeurs ARROW_ACTIVE
   */
  const updateFeederInfo = useCallback(
    (id: string, value: number) => {
      if (!svgContainerRef.current) return;
      if (id == "") return;

      // Utiliser d3 pour sélectionner l'élément SVG
      const svg = d3.select(svgContainerRef.current).select('svg');
      if (svg.empty()) {
        console.warn('SVG non trouvé dans le conteneur');
        return;
      }

      // Sélectionner l'élément du SVG
      const svgElement = svg.select(`#${id}`);
      if (svgElement.empty()) {
        console.warn(`Élément avec l'ID ${id} non trouvé dans le SVG`);
        return;
      }

      // Element de type feeder avec une balise sld-label contenant la valeur
      const textElement = svgElement.select('.sld-label');
      if (!textElement.empty()) {

        // Mettre à jour la valeur en conservant l'unité
        // Seulement 4 décimales
        const text = `${parseFloat(value.toFixed(4))}`;
        textElement.text(text);

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
      // console.log(
      //   `Mise à jour de ${id} avec la valeur: ${value} (${
      //     value > 0 ? 'sld-in' : value < 0 ? 'sld-out' : 'neutre'
      //   })`,
      // );
      } else if (svgElement.classed('sld-open') || svgElement.classed('sld-closed')) {
        // Breaker element
        const value_int = parseInt(value.toFixed(value))
        if (svgElement.classed('sld-switching'))
          console.log("element switching: ", id)
        if (value_int == 1 && svgElement.classed('sld-open') && svgElement.classed('sld-switching')) {
          console.log("fin switching open", id)
          svgElement.classed('sld-switching', false)
        } else if (value_int == 2 && svgElement.classed('sld-closed') && svgElement.classed('sld-switching')) {
          console.log("fin switching close", id)
          svgElement.classed('sld-switching', false)
        } else if (value_int == 1 && svgElement.classed('sld-closed') && !svgElement.classed('sld-switching')) {
          svgElement.classed('sld-open', true);
          svgElement.classed('sld-closed', false);
          console.log("open switch ", id)
        } else if (value_int == 2 && svgElement.classed('sld-open') && !svgElement.classed('sld-switching')) {
          svgElement.classed('sld-open', false);
          svgElement.classed('sld-closed', true);
          console.log("close switch ", id)
        }
      } else {
        console.log(`Element not managed: ${id}`)
      }
    },
    [svgContainerRef],
  );

  // Fonction pour traiter les messages de mise à jour
  const handleUpdateMessage = useCallback(
    (message: TeleInformation) => {
      // Traiter uniquement les messages de type TM (télémesure)
      if (message.ti === 'TM') {
        updateFeederInfo(message.data.id, message.data.value);
      }
    },
    [updateFeederInfo],
  );

  useEffect(() => {
    if (!svgContent || !svgContainerRef.current || !metadata) return;

    // Utiliser d3 pour accéder au SVG
    const svg = d3.select(svgContainerRef.current).select('svg');
    if (svg.empty()) return;

    /*  Désactivé pour faire apparaitre des étoiles !! (Pas encore trouvé ce que ça casse) */
    // // Éviter les mises à jour inutiles si les métadonnées n'ont pas changé
    // if (metadata === previousMetadataRef.current) return;
    // previousMetadataRef.current = metadata;

    // Initialiser les valeurs par défaut des feeders
    initializeFeederValues();

    // Ajouter des interactions au SVG
    svg
      .style('cursor', 'pointer')
      .on('mouseover', function (event) {
        // Récupérer l'élément survolé
        const target = d3.select(event.target);

        // Si c'est un élément avec un ID, on peut ajouter un effet visuel
        if (
          target.attr('id') &&
          (target.classed('sld-breaker') ||
            target.classed('sld-disconnector') ||
            target.classed('sld-load') ||
            target.classed('sld-generator'))
        ) {
          target.style('stroke-width', function () {
            // Augmenter l'épaisseur du contour
            const currentWidth = parseFloat(
              target.style('stroke-width') || '1',
            );
            return `${currentWidth * 1.5}px`;
          });
        }
      })
      .on('mouseout', function (event) {
        // Réinitialiser le style au survol
        const target = d3.select(event.target);
        if (target.attr('id')) {
          target.style('stroke-width', null);
        }
      });
  }, [svgContent, svgContainerRef, metadata, initializeFeederValues]);

  return {
    handleUpdateMessage,
  };
};
