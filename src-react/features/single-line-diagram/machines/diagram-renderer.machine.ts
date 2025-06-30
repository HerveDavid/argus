import { setup, assign, fromCallback, fromPromise } from 'xstate';
import * as d3 from 'd3';
import { SldDiagram } from '@/types/sld-diagram';
import { SldMetadata, Node, Wire, FeederInfo } from '@/types/sld-metadata';

// ===== TYPES =====

export interface DiagramRendererContext {
  // Références SVG
  svgRef: React.RefObject<SVGSVGElement> | null;
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null;
  currentTransform: d3.ZoomTransform | null;
  
  // Données du diagramme
  diagramData: SldDiagram | null;
  enrichedElements: ElementData[];
  
  // État du rendu
  isInitialized: boolean;
  isAnimating: boolean;
  animationQueue: AnimationTask[];
  
  // Interactions
  selectedElements: Set<string>;
  hoveredElement: string | null;
  contextMenuTarget: SVGElement | null;
  
  // Configuration
  config: DiagramConfig;
  
  // Erreurs
  renderError: string | null;
}

export interface ElementData {
  id: string;
  type: 'breaker' | 'disconnector' | 'wire' | 'feeder' | 'busbar' | 'node' | 'other';
  element: Element;
  
  // Attributs SVG
  transform?: string;
  fill?: string;
  stroke?: string;
  className?: string;
  d?: string;
  
  // Métadonnées enrichies
  equipmentId?: string;
  isOpen?: boolean;
  direction?: string;
  powerActive?: number;
  powerReactive?: number;
  
  // Animation
  priority: number;
  animationState: 'idle' | 'animating' | 'completed';
}

export interface AnimationTask {
  id: string;
  type: 'enter' | 'update' | 'exit' | 'breaker_toggle' | 'power_update';
  elementIds: string[];
  duration: number;
  delay: number;
  priority: number;
}

export interface DiagramConfig {
  transitionDuration: number;
  enableAnimations: boolean;
  enableZoom: boolean;
  minZoom: number;
  maxZoom: number;
  enablePan: boolean;
  enableContextMenu: boolean;
  debugMode: boolean;
}

export interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

// ===== ÉVÉNEMENTS =====

export type DiagramRendererEvent =
  // Initialisation
  | { type: 'INITIALIZE'; svgRef: React.RefObject<SVGSVGElement> }
  | { type: 'SET_CONFIG'; config: Partial<DiagramConfig> }
  
  // Données
  | { type: 'SET_DIAGRAM_DATA'; data: SldDiagram }
  | { type: 'UPDATE_DIAGRAM_DATA'; data: SldDiagram }
  | { type: 'CLEAR_DIAGRAM' }
  
  // Zoom et Pan
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'ZOOM_TO_FIT' }
  | { type: 'ZOOM_TO_SELECTION' }
  | { type: 'RESET_ZOOM' }
  | { type: 'SET_ZOOM'; zoom: ZoomState }
  
  // Interactions utilisateur
  | { type: 'ELEMENT_CLICK'; elementId: string; ctrlKey: boolean }
  | { type: 'ELEMENT_HOVER'; elementId: string | null }
  | { type: 'ELEMENT_CONTEXT_MENU'; element: SVGElement; position: { x: number; y: number } }
  | { type: 'CANVAS_CLICK' }
  | { type: 'CLEAR_SELECTION' }
  
  // Actions spécifiques
  | { type: 'TOGGLE_BREAKER'; breakerId: string }
  | { type: 'SELECT_ELEMENTS'; elementIds: string[] }
  | { type: 'DESELECT_ELEMENTS'; elementIds: string[] }
  
  // Animation
  | { type: 'ANIMATION_STARTED' }
  | { type: 'ANIMATION_COMPLETED' }
  | { type: 'SKIP_ANIMATIONS' }
  
  // Erreurs
  | { type: 'RENDER_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' };

// ===== ACTEURS =====

// Acteur pour l'enrichissement des données
const enrichElementsActor = fromPromise(async ({
  input
}: {
  input: { svgString: string; metadata?: SldMetadata }
}): Promise<ElementData[]> => {
  const { svgString, metadata } = input;
  
  if (!svgString?.trim()) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`SVG parsing error: ${parserError.textContent}`);
    }

    const elements: ElementData[] = [];

    // Créer des maps pour un accès rapide
    const nodeMap = new Map<string, Node>();
    const wireMap = new Map<string, Wire>();
    const feederMap = new Map<string, FeederInfo>();

    metadata?.nodes?.forEach((node) => {
      if (node?.id) {
        nodeMap.set(node.id, node);
        if (node.equipmentId) nodeMap.set(node.equipmentId, node);
      }
    });

    metadata?.wires?.forEach((wire) => {
      if (wire?.id) wireMap.set(wire.id, wire);
    });

    metadata?.feederInfos?.forEach((feeder) => {
      if (feeder?.id) feederMap.set(feeder.id, feeder);
    });

    // Extraire les éléments du SVG
    doc.querySelectorAll('[id]').forEach((element) => {
      if (!element?.id || element.id.trim() === '') return;

      const node = nodeMap.get(element.id);
      const wire = wireMap.get(element.id);
      const feeder = feederMap.get(element.id);
      const classList = element.getAttribute('class')?.split(' ') || [];

      // Déterminer le type et la priorité
      let type: ElementData['type'] = 'other';
      let priority = 5;

      if (classList.includes('sld-breaker') || node?.componentType === 'BREAKER') {
        type = 'breaker';
        priority = 1;
      } else if (classList.includes('sld-disconnector') || node?.componentType === 'DISCONNECTOR') {
        type = 'disconnector';
        priority = 2;
      } else if (classList.includes('sld-wire') || wire) {
        type = 'wire';
        priority = 3;
      } else if (classList.some((cls) => cls.includes('feeder')) || feeder) {
        type = 'feeder';
        priority = 4;
      } else if (classList.includes('sld-busbar-section')) {
        type = 'busbar';
        priority = 2;
      } else if (classList.includes('sld-node')) {
        type = 'node';
        priority = 6;
      }

      // Extraire les données de puissance
      let powerActive: number | undefined;
      let powerReactive: number | undefined;

      if (type === 'feeder' && element.textContent) {
        const text = element.textContent.trim();
        const numValue = parseFloat(text);
        if (!isNaN(numValue)) {
          if (classList.includes('sld-active-power')) {
            powerActive = numValue;
          } else if (classList.includes('sld-reactive-power')) {
            powerReactive = numValue;
          }
        }
      }

      elements.push({
        id: element.id,
        type,
        element: element.cloneNode(true) as Element,
        transform: element.getAttribute('transform') || undefined,
        fill: element.getAttribute('fill') || undefined,
        stroke: element.getAttribute('stroke') || undefined,
        className: element.getAttribute('class') || undefined,
        d: element.getAttribute('d') || undefined,
        equipmentId: node?.equipmentId,
        isOpen: node?.open,
        direction: node?.direction,
        powerActive,
        powerReactive,
        priority,
        animationState: 'idle',
      });
    });

    return elements.sort((a, b) => a.priority - b.priority);
  } catch (error) {
    throw new Error(`Error enriching element data: ${error}`);
  }
});

// Acteur pour les animations SVG
const animationActor = fromCallback(({ sendBack, input }) => {
  const { task, svgRef, config } = input as {
    task: AnimationTask;
    svgRef: React.RefObject<SVGSVGElement>;
    config: DiagramConfig;
  };

  if (!svgRef.current || !config.enableAnimations) {
    sendBack({ type: 'ANIMATION_COMPLETED' });
    return;
  }

  const svg = d3.select(svgRef.current);
  const mainGroup = svg.select('g.zoom-group');

  if (mainGroup.empty()) {
    sendBack({ type: 'ANIMATION_COMPLETED' });
    return;
  }

  // Logique d'animation selon le type
  switch (task.type) {
    case 'breaker_toggle':
      animateBreakerToggle(mainGroup, task, config).then(() => {
        sendBack({ type: 'ANIMATION_COMPLETED' });
      });
      break;
      
    case 'power_update':
      animatePowerUpdate(mainGroup, task, config).then(() => {
        sendBack({ type: 'ANIMATION_COMPLETED' });
      });
      break;
      
    default:
      setTimeout(() => {
        sendBack({ type: 'ANIMATION_COMPLETED' });
      }, task.duration);
  }

  // Cleanup function
  return () => {
    // Arrêter les animations en cours si nécessaire
  };
});

// ===== FONCTIONS D'ANIMATION =====

async function animateBreakerToggle(
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  task: AnimationTask,
  config: DiagramConfig
): Promise<void> {
  return new Promise((resolve) => {
    task.elementIds.forEach((elementId) => {
      const element = mainGroup.select(`#${elementId}`);
      if (element.empty()) return;

      element
        .transition()
        .duration(config.transitionDuration * 0.3)
        .style('opacity', 0.3)
        .transition()
        .duration(config.transitionDuration * 0.3)
        .style('opacity', 1)
        .on('end', resolve);
    });
  });
}

async function animatePowerUpdate(
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  task: AnimationTask,
  config: DiagramConfig
): Promise<void> {
  return new Promise((resolve) => {
    task.elementIds.forEach((elementId) => {
      const element = mainGroup.select(`#${elementId}`);
      if (element.empty()) return;

      const textElement = element.select('text');
      if (textElement.empty()) return;

      textElement
        .transition()
        .duration(config.transitionDuration)
        .ease(d3.easeQuadInOut)
        .tween('power', function() {
          const currentValue = parseFloat(textElement.text()) || 0;
          const targetValue = 100; // À récupérer depuis les données
          const interpolator = d3.interpolateNumber(currentValue, targetValue);

          return function(t: number) {
            const value = Math.round(interpolator(t));
            textElement.text(value.toString());
          };
        })
        .on('end', resolve);
    });
  });
}

// ===== CONFIGURATION PAR DÉFAUT =====

const defaultConfig: DiagramConfig = {
  transitionDuration: 500,
  enableAnimations: true,
  enableZoom: true,
  minZoom: 0.1,
  maxZoom: 10,
  enablePan: true,
  enableContextMenu: true,
  debugMode: false,
};

// ===== MACHINE PRINCIPALE =====

export const diagramRendererMachine = setup({
  types: {
    context: {} as DiagramRendererContext,
    events: {} as DiagramRendererEvent,
  },
  actors: {
    enrichElements: enrichElementsActor,
    animate: animationActor,
  },
  guards: {
    hasValidSvgRef: ({ context }) => {
      return context.svgRef?.current != null;
    },
    hasDiagramData: ({ context }) => {
      return context.diagramData != null;
    },
    isAnimationEnabled: ({ context }) => {
      return context.config.enableAnimations;
    },
    hasAnimationQueue: ({ context }) => {
      return context.animationQueue.length > 0;
    },
    isBreaker: ({ context, event }) => {
      if (event.type !== 'TOGGLE_BREAKER') return false;
      const element = context.enrichedElements.find(el => el.id === event.breakerId);
      return element?.type === 'breaker';
    },
  },
  actions: {
    setSvgRef: assign(({ context, event }) => {
      if (event.type !== 'INITIALIZE') return context;
      return {
        ...context,
        svgRef: event.svgRef,
      };
    }),

    setConfig: assign(({ context, event }) => {
      if (event.type !== 'SET_CONFIG') return context;
      return {
        ...context,
        config: { ...context.config, ...event.config },
      };
    }),

    setDiagramData: assign(({ context, event }) => {
      if (event.type !== 'SET_DIAGRAM_DATA' && event.type !== 'UPDATE_DIAGRAM_DATA') {
        return context;
      }
      return {
        ...context,
        diagramData: event.data,
        renderError: null,
      };
    }),

    setEnrichedElements: assign(({ context, event }) => ({
      ...context,
      enrichedElements: event.output || [],
    })),

    clearDiagram: assign(({ context }) => ({
      ...context,
      diagramData: null,
      enrichedElements: [],
      selectedElements: new Set(),
      hoveredElement: null,
      contextMenuTarget: null,
      animationQueue: [],
      isAnimating: false,
    })),

    setInitialized: assign(({ context }) => ({
      ...context,
      isInitialized: true,
    })),

    setRenderError: assign(({ context, event }) => {
      if (event.type !== 'RENDER_ERROR') return context;
      return {
        ...context,
        renderError: event.error,
      };
    }),

    clearError: assign(({ context }) => ({
      ...context,
      renderError: null,
    })),

    setHoveredElement: assign(({ context, event }) => {
      if (event.type !== 'ELEMENT_HOVER') return context;
      return {
        ...context,
        hoveredElement: event.elementId,
      };
    }),

    toggleElementSelection: assign(({ context, event }) => {
      if (event.type !== 'ELEMENT_CLICK') return context;
      
      const newSelection = new Set(context.selectedElements);
      
      if (event.ctrlKey) {
        if (newSelection.has(event.elementId)) {
          newSelection.delete(event.elementId);
        } else {
          newSelection.add(event.elementId);
        }
      } else {
        newSelection.clear();
        newSelection.add(event.elementId);
      }

      return {
        ...context,
        selectedElements: newSelection,
      };
    }),

    clearSelection: assign(({ context }) => ({
      ...context,
      selectedElements: new Set(),
    })),

    setContextMenuTarget: assign(({ context, event }) => {
      if (event.type !== 'ELEMENT_CONTEXT_MENU') return context;
      return {
        ...context,
        contextMenuTarget: event.element,
      };
    }),

    addAnimationTask: assign(({ context, event }) => {
      if (event.type !== 'TOGGLE_BREAKER') return context;
      
      const task: AnimationTask = {
        id: `breaker_toggle_${event.breakerId}_${Date.now()}`,
        type: 'breaker_toggle',
        elementIds: [event.breakerId],
        duration: context.config.transitionDuration,
        delay: 0,
        priority: 1,
      };

      return {
        ...context,
        animationQueue: [...context.animationQueue, task],
      };
    }),

    startAnimation: assign(({ context }) => ({
      ...context,
      isAnimating: true,
    })),

    completeAnimation: assign(({ context }) => ({
      ...context,
      isAnimating: false,
      animationQueue: context.animationQueue.slice(1),
    })),
  },
}).createMachine({
  id: 'diagramRenderer',
  initial: 'uninitialized',
  context: {
    svgRef: null,
    zoomBehavior: null,
    currentTransform: null,
    diagramData: null,
    enrichedElements: [],
    isInitialized: false,
    isAnimating: false,
    animationQueue: [],
    selectedElements: new Set(),
    hoveredElement: null,
    contextMenuTarget: null,
    config: defaultConfig,
    renderError: null,
  },
  states: {
    uninitialized: {
      on: {
        INITIALIZE: {
          target: 'idle',
          actions: 'setSvgRef',
        },
      },
    },
    idle: {
      on: {
        SET_CONFIG: {
          actions: 'setConfig',
        },
        SET_DIAGRAM_DATA: {
          target: 'enriching',
          actions: 'setDiagramData',
        },
        CLEAR_DIAGRAM: {
          actions: 'clearDiagram',
        },
      },
    },
    enriching: {
      invoke: {
        id: 'enrichElements',
        src: 'enrichElements',
        input: ({ context }) => ({
          svgString: context.diagramData?.svg || '',
          metadata: context.diagramData?.metadata,
        }),
        onDone: {
          target: 'rendering',
          actions: 'setEnrichedElements',
        },
        onError: {
          target: 'error',
          actions: assign(({ context, event }) => ({
            ...context,
            renderError: `Enrichment error: ${event.error}`,
          })),
        },
      },
    },
    rendering: {
      always: [
        {
          guard: 'hasValidSvgRef',
          target: 'ready',
          actions: 'setInitialized',
        },
        {
          target: 'error',
          actions: assign(({ context }) => ({
            ...context,
            renderError: 'Invalid SVG reference',
          })),
        },
      ],
    },
    ready: {
      initial: 'interactive',
      states: {
        interactive: {
          on: {
            ELEMENT_CLICK: {
              actions: 'toggleElementSelection',
            },
            ELEMENT_HOVER: {
              actions: 'setHoveredElement',
            },
            ELEMENT_CONTEXT_MENU: {
              actions: 'setContextMenuTarget',
            },
            CANVAS_CLICK: {
              actions: 'clearSelection',
            },
            CLEAR_SELECTION: {
              actions: 'clearSelection',
            },
            TOGGLE_BREAKER: [
              {
                guard: 'isBreaker',
                target: 'animating',
                actions: 'addAnimationTask',
              },
            ],
          },
        },
        animating: {
          always: [
            {
              guard: 'hasAnimationQueue',
              target: 'processingAnimation',
            },
            {
              target: 'interactive',
            },
          ],
        },
        processingAnimation: {
          entry: 'startAnimation',
          invoke: {
            id: 'processAnimation',
            src: 'animate',
            input: ({ context }) => ({
              task: context.animationQueue[0],
              svgRef: context.svgRef,
              config: context.config,
            }),
            onDone: {
              target: 'animating',
              actions: 'completeAnimation',
            },
          },
        },
      },
      on: {
        UPDATE_DIAGRAM_DATA: {
          target: 'enriching',
          actions: 'setDiagramData',
        },
        SET_CONFIG: {
          actions: 'setConfig',
        },
        CLEAR_DIAGRAM: {
          target: 'idle',
          actions: 'clearDiagram',
        },
        SKIP_ANIMATIONS: {
          target: '.interactive',
          actions: assign(({ context }) => ({
            ...context,
            animationQueue: [],
            isAnimating: false,
          })),
        },
      },
    },
    error: {
      on: {
        CLEAR_ERROR: {
          target: 'idle',
          actions: 'clearError',
        },
        SET_DIAGRAM_DATA: {
          target: 'enriching',
          actions: ['setDiagramData', 'clearError'],
        },
        CLEAR_DIAGRAM: {
          target: 'idle',
          actions: ['clearDiagram', 'clearError'],
        },
      },
    },
  },
});