import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { SVGContextMenu } from './svg-context-menu';

import { SldDiagram } from '@/types/sld-diagram';
import { SldMetadata, Node } from '@/types/sld-metadata';

interface DiagramContentProps {
  svgRef: React.RefObject<SVGSVGElement>;
  diagramData?: SldDiagram;
}

export const DiagramContent: React.FC<DiagramContentProps> = ({
  svgRef,
  diagramData,
}) => {
  const [targetElement, setTargetElement] = useState<SVGElement | null>(null);
  const previousDataRef = useRef<string | null>(null);
  const previousBreakersStateRef = useRef<Map<string, boolean>>(new Map());
  const currentTransformRef = useRef<d3.ZoomTransform | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<
    SVGSVGElement,
    unknown
  > | null>(null);
  const transitionDuration = 800;
  const isTransitioningRef = useRef(false);

  // Fonction pour extraire l'état des breakers depuis les métadonnées
  const extractBreakersState = useCallback(
    (metadata?: SldMetadata): Map<string, boolean> => {
      const breakersState = new Map<string, boolean>();

      if (!metadata) return breakersState;

      // Parcourir tous les nodes pour trouver les breakers
      metadata.nodes.forEach((node: Node) => {
        if (
          node.componentType &&
          ['BREAKER', 'DISCONNECTOR', 'LOAD_BREAK_SWITCH'].includes(
            node.componentType,
          )
        ) {
          // Utiliser l'ID du node ou l'equipmentId s'il existe
          const breakerId = node.equipmentId || node.id;
          breakersState.set(breakerId, !node.open); // !node.open car open=true signifie ouvert (false = fermé)
        }
      });

      return breakersState;
    },
    [],
  );

  // Fonction pour comparer l'état des breakers
  const hasBreakersStateChanged = useCallback(
    (
      oldState: Map<string, boolean>,
      newState: Map<string, boolean>,
    ): boolean => {
      // Vérifier si le nombre de breakers a changé
      if (oldState.size !== newState.size) return true;

      // Vérifier si l'état de chaque breaker a changé
      for (const [breakerId, newIsClosedState] of newState) {
        const oldIsClosedState = oldState.get(breakerId);
        if (
          oldIsClosedState === undefined ||
          oldIsClosedState !== newIsClosedState
        ) {
          return true;
        }
      }

      return false;
    },
    [],
  );

  // Fonction pour extraire les éléments animables en utilisant les métadonnées
  const extractAnimatableElements = useCallback(
    (svgString: string, metadata?: SldMetadata) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const elements = new Map();

      // Utiliser les métadonnées pour identifier les éléments importants
      const importantElements = new Set<string>();

      if (metadata) {
        // Ajouter les nodes (switches, feeders, etc.)
        metadata.nodes.forEach((node) => {
          importantElements.add(node.id);
          if (node.equipmentId) importantElements.add(node.equipmentId);
        });

        // Ajouter les wires/connections
        metadata.wires.forEach((wire) => {
          importantElements.add(wire.id);
        });

        // Ajouter les feeders
        metadata.feederInfos.forEach((feeder) => {
          importantElements.add(feeder.id);
          importantElements.add(feeder.equipmentId);
        });
      }

      // Sélectionner tous les éléments avec ID
      const selectableElements = doc.querySelectorAll('[id]');

      selectableElements.forEach((element) => {
        if (element.id) {
          const isImportant = importantElements.has(element.id);

          elements.set(element.id, {
            element: element.cloneNode(true),
            transform: element.getAttribute('transform'),
            fill: element.getAttribute('fill'),
            stroke: element.getAttribute('stroke'),
            opacity: element.getAttribute('opacity'),
            d: element.getAttribute('d'), // Pour les paths (wires)
            cx: element.getAttribute('cx'), // Pour les cercles
            cy: element.getAttribute('cy'),
            r: element.getAttribute('r'),
            x: element.getAttribute('x'), // Pour les rectangles
            y: element.getAttribute('y'),
            width: element.getAttribute('width'),
            height: element.getAttribute('height'),
            className: element.getAttribute('class'),
            // Métadonnées supplémentaires
            isImportant,
            nodeData: metadata?.nodes.find(
              (n) => n.id === element.id || n.equipmentId === element.id,
            ),
            wireData: metadata?.wires.find((w) => w.id === element.id),
            feederData: metadata?.feederInfos.find(
              (f) => f.id === element.id || f.equipmentId === element.id,
            ),
          });
        }
      });

      return elements;
    },
    [],
  );

  // Fonction pour interpoler les changements avec priorités basées sur les métadonnées
  const animateChanges = useCallback(
    (
      oldElements: Map<string, any>,
      newSvgString: string,
      newMetadata?: SldMetadata,
    ) => {
      if (!svgRef.current) return;

      const newElements = extractAnimatableElements(newSvgString, newMetadata);
      const svg = d3.select(svgRef.current);

      isTransitioningRef.current = true;

      // Créer des groupes d'animation par priorité
      const switchElements = new Set<string>();
      const wireElements = new Set<string>();
      const feederElements = new Set<string>();

      if (newMetadata) {
        newMetadata.nodes.forEach((node) => {
          if (
            node.componentType &&
            ['BREAKER', 'DISCONNECTOR', 'LOAD_BREAK_SWITCH'].includes(
              node.componentType,
            )
          ) {
            switchElements.add(node.id);
            if (node.equipmentId) switchElements.add(node.equipmentId);
          }
        });

        newMetadata.wires.forEach((wire) => wireElements.add(wire.id));
        newMetadata.feederInfos.forEach((feeder) => {
          feederElements.add(feeder.id);
          feederElements.add(feeder.equipmentId);
        });
      }

      // Animation par phases avec délais
      const animateElementGroup = (
        elementIds: Set<string>,
        delay: number = 0,
      ) => {
        elementIds.forEach((id) => {
          const newData = newElements.get(id);
          const oldData = oldElements.get(id);
          const element = svg.select(`#${id}`);

          if (element.empty() || !newData) return;

          // Délai pour staggers les animations
          const baseDelay = delay;

          // Animation des transformations
          if (oldData?.transform !== newData.transform && newData.transform) {
            element
              .transition()
              .delay(baseDelay)
              .duration(transitionDuration)
              .ease(d3.easeQuadInOut)
              .attr('transform', newData.transform);
          }

          // Animation des couleurs avec priorité pour les switches
          if (oldData?.fill !== newData.fill && newData.fill) {
            const duration = switchElements.has(id)
              ? transitionDuration * 0.6
              : transitionDuration;
            element
              .transition()
              .delay(baseDelay)
              .duration(duration)
              .ease(d3.easeQuadInOut)
              .attr('fill', newData.fill);
          }

          if (oldData?.stroke !== newData.stroke && newData.stroke) {
            element
              .transition()
              .delay(baseDelay)
              .duration(transitionDuration)
              .ease(d3.easeQuadInOut)
              .attr('stroke', newData.stroke);
          }

          // Animation spéciale pour les changements d'état des switches
          if (
            switchElements.has(id) &&
            oldData?.className !== newData.className
          ) {
            element
              .transition()
              .delay(baseDelay)
              .duration(200)
              .ease(d3.easeQuadInOut)
              .style('opacity', 0.3)
              .transition()
              .duration(400)
              .ease(d3.easeQuadInOut)
              .style('opacity', 1)
              .attr('class', newData.className);
          }

          // Animation des paths pour les wires
          if (wireElements.has(id) && oldData?.d !== newData.d && newData.d) {
            element
              .transition()
              .delay(baseDelay + 100) // Légère attente pour les wires
              .duration(transitionDuration)
              .ease(d3.easeQuadInOut)
              .attrTween('d', function () {
                const oldPath = oldData.d || newData.d;
                const newPath = newData.d;
                return d3.interpolateString(oldPath, newPath);
              });
          }

          // Autres animations géométriques...
          ['cx', 'cy', 'r', 'x', 'y', 'width', 'height'].forEach((attr) => {
            if (newData[attr] !== null && oldData?.[attr] !== newData[attr]) {
              element
                .transition()
                .delay(baseDelay)
                .duration(transitionDuration)
                .ease(d3.easeQuadInOut)
                .attr(attr, newData[attr]);
            }
          });
        });
      };

      // Animer par groupes avec des délais échelonnés
      animateElementGroup(switchElements, 0); // Switches en premier
      animateElementGroup(wireElements, 150); // Wires ensuite
      animateElementGroup(feederElements, 100); // Feeders en parallèle

      // Animation des autres éléments
      const allImportantElements = new Set([
        ...switchElements,
        ...wireElements,
        ...feederElements,
      ]);
      const otherElements = new Set<string>();
      newElements.forEach((_, id) => {
        if (!allImportantElements.has(id)) {
          otherElements.add(id);
        }
      });
      animateElementGroup(otherElements, 200);

      // Animation des nouveaux éléments (fade in)
      newElements.forEach((data, id) => {
        if (!oldElements.has(id)) {
          const element = svg.select(`#${id}`);
          if (!element.empty()) {
            const delay = switchElements.has(id)
              ? 0
              : wireElements.has(id)
                ? 150
                : 200;
            element
              .style('opacity', 0)
              .transition()
              .delay(delay)
              .duration(transitionDuration)
              .ease(d3.easeQuadInOut)
              .style('opacity', 1);
          }
        }
      });

      // Animation des éléments supprimés (fade out)
      oldElements.forEach((_, id) => {
        if (!newElements.has(id)) {
          const element = svg.select(`#${id}`);
          if (!element.empty()) {
            element
              .transition()
              .duration(transitionDuration * 0.5)
              .ease(d3.easeQuadInOut)
              .style('opacity', 0)
              .remove();
          }
        }
      });

      // Marquer la fin de la transition
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, transitionDuration + 300);
    },
    [svgRef, extractAnimatableElements, transitionDuration],
  );

  // Initialiser le zoom behavior une seule fois
  useEffect(() => {
    if (!svgRef.current || zoomBehaviorRef.current) return;

    // Créer le zoom behavior avec le bon typage
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        // Sauvegarder le transform actuel
        currentTransformRef.current = event.transform;

        // Appliquer la transformation au groupe principal avec zoom-group
        const svg = d3.select(svgRef.current as SVGSVGElement);
        const mainGroup = svg.select<SVGGElement>('g.zoom-group');
        if (!mainGroup.empty()) {
          mainGroup.attr('transform', event.transform.toString());
        }
      });

    // Appliquer le zoom behavior au SVG avec le bon typage
    const svgSelection = d3.select(svgRef.current as SVGSVGElement);
    svgSelection.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Cleanup
    return () => {
      if (svgRef.current) {
        d3.select(svgRef.current as SVGSVGElement).on('.zoom', null);
      }
    };
  }, [svgRef]);

  // Approche alternative : Mise à jour sélective sans innerHTML
  const updateSvgContent = useCallback(
    (newSvgString: string, metadata?: SldMetadata) => {
      if (!svgRef.current) return;

      const parser = new DOMParser();
      const newDoc = parser.parseFromString(newSvgString, 'image/svg+xml');
      const newSvgElement = newDoc.documentElement;

      // Obtenir ou créer le groupe principal pour le zoom
      const svg = d3.select(svgRef.current as SVGSVGElement);
      let mainGroup = svg.select<SVGGElement>('g.zoom-group');

      if (mainGroup.empty()) {
        mainGroup = svg.append<SVGGElement>('g').attr('class', 'zoom-group');
      }

      // Sauvegarder le transform actuel
      const currentTransform = currentTransformRef.current;

      // Extraire les éléments de l'ancien contenu pour l'animation
      const oldElements = mainGroup.empty()
        ? new Map()
        : extractAnimatableElements(
            mainGroup.node()?.innerHTML || '',
            metadata,
          );

      // Copier le nouveau contenu dans le groupe principal
      const newContent = Array.from(newSvgElement.children);
      mainGroup.selectAll('*').remove(); // Nettoyer l'ancien contenu

      newContent.forEach((child) => {
        const importedNode = document.importNode(child, true);
        mainGroup.node()?.appendChild(importedNode);
      });

      // Restaurer le transform si nécessaire
      if (currentTransform) {
        mainGroup.attr('transform', currentTransform.toString());
      }

      // Lancer l'animation
      if (oldElements.size > 0) {
        requestAnimationFrame(() => {
          animateChanges(oldElements, newSvgElement.innerHTML, metadata);
        });
      }
    },
    [svgRef, extractAnimatableElements, animateChanges],
  );

  // Effect principal pour gérer les mises à jour du SVG UNIQUEMENT si les breakers ont changé
  useEffect(() => {
    if (!diagramData?.svg || !svgRef.current) return;

    const newSvgString = diagramData.svg;
    const newMetadata = diagramData.metadata;

    // Extraire l'état actuel des breakers
    const currentBreakersState = extractBreakersState(newMetadata);

    // Si c'est la première fois, initialiser
    if (!previousDataRef.current) {
      console.log('Initialisation du SVG (première fois)');
      updateSvgContent(newSvgString, newMetadata);
      previousDataRef.current = newSvgString;
      previousBreakersStateRef.current = currentBreakersState;
      return;
    }

    // Vérifier si l'état des breakers a changé
    const breakersStateChanged = hasBreakersStateChanged(
      previousBreakersStateRef.current,
      currentBreakersState,
    );

    if (!breakersStateChanged) {
      console.log(
        "Aucun changement d'état des breakers détecté - pas de mise à jour SVG",
      );
      return;
    }

    console.log("Changement d'état des breakers détecté - mise à jour du SVG");
    console.log(
      'État précédent:',
      Object.fromEntries(previousBreakersStateRef.current),
    );
    console.log('Nouvel état:', Object.fromEntries(currentBreakersState));

    // Mettre à jour le contenu de manière sélective
    updateSvgContent(newSvgString, newMetadata);

    // Sauvegarder pour la prochaine fois
    previousDataRef.current = newSvgString;
    previousBreakersStateRef.current = currentBreakersState;
  }, [
    diagramData?.svg,
    diagramData?.metadata,
    svgRef,
    updateSvgContent,
    extractBreakersState,
    hasBreakersStateChanged,
  ]);

  // Fonction pour gérer le toggle des disjoncteurs avec animation
  const toggleBreaker = useCallback(
    (breakerId: string, isClosed: boolean) => {
      if (!svgRef.current || isTransitioningRef.current) return;

      const breakerElement = svgRef.current.querySelector(`#${breakerId}`);
      if (!breakerElement || !(breakerElement instanceof SVGElement)) return;

      const element = d3.select(breakerElement);

      // Animation de transition d'état
      element
        .transition()
        .duration(300)
        .ease(d3.easeQuadInOut)
        .style('opacity', 0.5)
        .transition()
        .duration(200)
        .ease(d3.easeQuadInOut)
        .style('opacity', 1)
        .on('start', () => {
          if (isClosed) {
            console.log('Open breaker', breakerId);
            breakerElement.classList.add('sld-switching');
            breakerElement.classList.remove('sld-closed');
            breakerElement.classList.add('sld-open');
          } else {
            console.log('Close breaker', breakerId);
            breakerElement.classList.add('sld-switching');
            breakerElement.classList.remove('sld-open');
            breakerElement.classList.add('sld-closed');
          }
        })
        .on('end', () => {
          breakerElement.classList.remove('sld-switching');
        });
    },
    [svgRef],
  );

  // Gestionnaire pour capturer l'élément ciblé
  const handleContextMenuTrigger = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Éviter d'ouvrir le menu contextuel pendant une transition
      if (isTransitioningRef.current) {
        e.preventDefault();
        return;
      }

      const target = e.target as SVGElement;
      let element: SVGElement | null = target;

      if (element && !element.id) {
        let parent = element.parentElement;
        while (parent && parent instanceof SVGElement && !parent.id) {
          parent = parent.parentElement;
        }
        if (parent instanceof SVGElement && parent.id) {
          element = parent;
        }
      }

      setTargetElement(element);
    },
    [],
  );

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <SVGContextMenu
          targetElement={targetElement}
          onToggleBreaker={toggleBreaker}
        >
          <svg
            ref={svgRef}
            className="w-full h-full cursor-default transition-all duration-200"
            style={{
              minHeight: '400px',
              // Désactiver les interactions pendant les transitions
              pointerEvents: isTransitioningRef.current ? 'none' : 'auto',
            }}
            onContextMenu={handleContextMenuTrigger}
            // Pas besoin d'autres event handlers car le zoom est géré par D3
          />
        </SVGContextMenu>
      </div>
    </div>
  );
};
