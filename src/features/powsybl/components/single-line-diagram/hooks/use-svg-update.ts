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
   * Fonction pour mettre à jour les informations d'un feeder dans le SVG
   * Pour l'instant, ne traite que les valeurs ARROW_ACTIVE
   */
  const updateFeederInfo = useCallback(
    (id: string, value: number) => {
      if (!svgContainerRef.current) return;

      // Utiliser d3 pour sélectionner l'élément SVG
      const svg = d3.select(svgContainerRef.current).select('svg');
      if (svg.empty()) {
        console.warn('SVG non trouvé dans le conteneur');
        return;
      }

      // Vérifier que c'est bien un élément de type ARROW_ACTIVE
      if (!id.includes('ARROW_ACTIVE')) {
        console.warn(
          'Seuls les éléments ARROW_ACTIVE sont pris en charge actuellement',
        );
        return;
      }

      // Sélectionner l'élément de groupe du feeder
      const feederGroup = svg.select(`#${id}`);
      if (feederGroup.empty()) {
        console.warn(`Élément avec l'ID ${id} non trouvé dans le SVG`);
        return;
      }

      // Sélectionner l'élément texte dans le groupe
      const textElement = feederGroup.select('.sld-label');
      if (textElement.empty()) {
        console.warn(`Élément texte non trouvé dans le feeder ${id}`);
        return;
      }

      // Mettre à jour la valeur en conservant l'unité MW
      const text = `${value} MW`;
      textElement.text(text);

      // Ajouter une petite animation pour mettre en évidence la mise à jour
      textElement
        .style('fill', 'red')
        .transition()
        .duration(1000)
        .style('fill', 'black');

      console.log(`Mise à jour de ${id} avec la valeur: ${value} MW`);
    },
    [svgContainerRef],
  );

  // Fonction pour traiter les messages de mise à jour
  const handleUpdateMessage = useCallback(
    (message: TeleInformation) => {
      // Traiter uniquement les messages de type TM (télémesure)
      if (message.ti === 'TM' && message.data.id.includes('ARROW_ACTIVE')) {
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

    // Éviter les mises à jour inutiles si les métadonnées n'ont pas changé
    if (metadata === previousMetadataRef.current) return;
    previousMetadataRef.current = metadata;

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
  }, [svgContent, svgContainerRef, metadata]);

  return {
    handleUpdateMessage,
  };
};
