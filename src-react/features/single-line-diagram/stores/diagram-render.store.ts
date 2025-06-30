import { useActor } from '@xstate/react';
import { useCallback } from 'react';
import {
  diagramRendererMachine,
  DiagramConfig,
  ZoomState,
  ElementData,
} from '../machines/diagram-renderer.machine';
import { SldDiagram } from '@/types/sld-diagram';
import React from 'react';

// ===== INTERFACE DU STORE =====
export type { DiagramConfig } from '../machines/diagram-renderer.machine';

export interface DiagramRendererStore {
  // État actuel
  state:
    | 'uninitialized'
    | 'idle'
    | 'enriching'
    | 'rendering'
    | 'ready'
    | 'error';
  subState: string | null;

  // États calculés
  isUninitialized: boolean;
  isIdle: boolean;
  isEnriching: boolean;
  isRendering: boolean;
  isReady: boolean;
  isError: boolean;
  isInteractive: boolean;
  isAnimating: boolean;

  // Données de rendu
  diagramData: SldDiagram | null;
  enrichedElements: ElementData[];
  selectedElements: Set<string>;
  hoveredElement: string | null;
  contextMenuTarget: SVGElement | null;

  // Configuration
  config: DiagramConfig;

  // État SVG
  isInitialized: boolean;
  currentTransform: any; // d3.ZoomTransform

  // Animation
  animationQueue: any[]; // AnimationTask[]
  isAnimatingState: boolean;

  // Erreurs
  renderError: string | null;

  // ===== ACTIONS DE BASE =====

  // Initialisation
  initialize: (svgRef: React.RefObject<SVGSVGElement>) => void;
  setConfig: (config: Partial<DiagramConfig>) => void;

  // Gestion des données
  setDiagramData: (data: SldDiagram) => void;
  updateDiagramData: (data: SldDiagram) => void;
  clearDiagram: () => void;

  // ===== INTERACTIONS UTILISATEUR =====

  // Sélection et hover
  clickElement: (elementId: string, ctrlKey?: boolean) => void;
  hoverElement: (elementId: string | null) => void;
  contextMenuElement: (
    element: SVGElement,
    position: { x: number; y: number },
  ) => void;
  clickCanvas: () => void;
  clearSelection: () => void;

  // Actions spécifiques
  toggleBreaker: (breakerId: string) => void;
  selectElements: (elementIds: string[]) => void;
  deselectElements: (elementIds: string[]) => void;

  // ===== GESTION DU ZOOM =====

  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  resetZoom: () => void;
  setZoom: (zoom: ZoomState) => void;

  // ===== ANIMATIONS =====

  skipAnimations: () => void;

  // ===== GESTION D'ERREUR =====

  clearError: () => void;

  // ===== HELPERS =====

  // Informations sur les éléments
  getElementData: (elementId: string) => ElementData | null;
  getElementsByType: (type: ElementData['type']) => ElementData[];
  getSelectedElementsData: () => ElementData[];
  getBreakers: () => ElementData[];
  getOpenBreakers: () => ElementData[];
  getClosedBreakers: () => ElementData[];

  // Statistiques
  getElementCount: () => number;
  getSelectedCount: () => number;
  getAnimationQueueLength: () => number;

  // État des animations
  hasActiveAnimations: () => boolean;
  getCurrentAnimationTask: () => any | null; // AnimationTask | null

  // Validation
  isValidElement: (elementId: string) => boolean;
  canToggleBreaker: (elementId: string) => boolean;

  // Debug
  getDebugInfo: () => {
    state: string;
    subState: string | null;
    elementCount: number;
    selectedCount: number;
    animationQueueLength: number;
    isInitialized: boolean;
    hasError: boolean;
    config: DiagramConfig;
  };
}

// ===== HOOK PRINCIPAL =====

export const useDiagramRendererStore = (): DiagramRendererStore => {
  const [state, send] = useActor(diagramRendererMachine);

  // Calculer l'état principal et sous-état
  const mainState =
    typeof state.value === 'string' ? state.value : Object.keys(state.value)[0];

  const subState =
    typeof state.value === 'object' && state.value !== null
      ? (Object.values(state.value)[0] as string)
      : null;

  // ===== ACTIONS DE BASE =====

  const initialize = useCallback(
    (svgRef: React.RefObject<SVGSVGElement>) => {
      send({ type: 'INITIALIZE', svgRef });
    },
    [send],
  );

  const setConfig = useCallback(
    (config: Partial<DiagramConfig>) => {
      send({ type: 'SET_CONFIG', config });
    },
    [send],
  );

  const setDiagramData = useCallback(
    (data: SldDiagram) => {
      send({ type: 'SET_DIAGRAM_DATA', data });
    },
    [send],
  );

  const updateDiagramData = useCallback(
    (data: SldDiagram) => {
      send({ type: 'UPDATE_DIAGRAM_DATA', data });
    },
    [send],
  );

  const clearDiagram = useCallback(() => {
    send({ type: 'CLEAR_DIAGRAM' });
  }, [send]);

  // ===== INTERACTIONS UTILISATEUR =====

  const clickElement = useCallback(
    (elementId: string, ctrlKey = false) => {
      send({ type: 'ELEMENT_CLICK', elementId, ctrlKey });
    },
    [send],
  );

  const hoverElement = useCallback(
    (elementId: string | null) => {
      send({ type: 'ELEMENT_HOVER', elementId });
    },
    [send],
  );

  const contextMenuElement = useCallback(
    (element: SVGElement, position: { x: number; y: number }) => {
      send({ type: 'ELEMENT_CONTEXT_MENU', element, position });
    },
    [send],
  );

  const clickCanvas = useCallback(() => {
    send({ type: 'CANVAS_CLICK' });
  }, [send]);

  const clearSelection = useCallback(() => {
    send({ type: 'CLEAR_SELECTION' });
  }, [send]);

  const toggleBreaker = useCallback(
    (breakerId: string) => {
      send({ type: 'TOGGLE_BREAKER', breakerId });
    },
    [send],
  );

  const selectElements = useCallback(
    (elementIds: string[]) => {
      send({ type: 'SELECT_ELEMENTS', elementIds });
    },
    [send],
  );

  const deselectElements = useCallback(
    (elementIds: string[]) => {
      send({ type: 'DESELECT_ELEMENTS', elementIds });
    },
    [send],
  );

  // ===== GESTION DU ZOOM =====

  const zoomIn = useCallback(() => {
    send({ type: 'ZOOM_IN' });
  }, [send]);

  const zoomOut = useCallback(() => {
    send({ type: 'ZOOM_OUT' });
  }, [send]);

  const zoomToFit = useCallback(() => {
    send({ type: 'ZOOM_TO_FIT' });
  }, [send]);

  const zoomToSelection = useCallback(() => {
    send({ type: 'ZOOM_TO_SELECTION' });
  }, [send]);

  const resetZoom = useCallback(() => {
    send({ type: 'RESET_ZOOM' });
  }, [send]);

  const setZoom = useCallback(
    (zoom: ZoomState) => {
      send({ type: 'SET_ZOOM', zoom });
    },
    [send],
  );

  // ===== ANIMATIONS =====

  const skipAnimations = useCallback(() => {
    send({ type: 'SKIP_ANIMATIONS' });
  }, [send]);

  // ===== GESTION D'ERREUR =====

  const clearError = useCallback(() => {
    send({ type: 'CLEAR_ERROR' });
  }, [send]);

  // ===== HELPERS =====

  const getElementData = useCallback(
    (elementId: string): ElementData | null => {
      return (
        state.context.enrichedElements.find((el) => el.id === elementId) || null
      );
    },
    [state.context.enrichedElements],
  );

  const getElementsByType = useCallback(
    (type: ElementData['type']): ElementData[] => {
      return state.context.enrichedElements.filter((el) => el.type === type);
    },
    [state.context.enrichedElements],
  );

  const getSelectedElementsData = useCallback((): ElementData[] => {
    return state.context.enrichedElements.filter((el) =>
      state.context.selectedElements.has(el.id),
    );
  }, [state.context.enrichedElements, state.context.selectedElements]);

  const getBreakers = useCallback((): ElementData[] => {
    return getElementsByType('breaker');
  }, [getElementsByType]);

  const getOpenBreakers = useCallback((): ElementData[] => {
    return getBreakers().filter((breaker) => breaker.isOpen === true);
  }, [getBreakers]);

  const getClosedBreakers = useCallback((): ElementData[] => {
    return getBreakers().filter((breaker) => breaker.isOpen === false);
  }, [getBreakers]);

  // Statistiques
  const getElementCount = useCallback((): number => {
    return state.context.enrichedElements.length;
  }, [state.context.enrichedElements]);

  const getSelectedCount = useCallback((): number => {
    return state.context.selectedElements.size;
  }, [state.context.selectedElements]);

  const getAnimationQueueLength = useCallback((): number => {
    return state.context.animationQueue.length;
  }, [state.context.animationQueue]);

  // État des animations
  const hasActiveAnimations = useCallback((): boolean => {
    return state.context.isAnimating || state.context.animationQueue.length > 0;
  }, [state.context.isAnimating, state.context.animationQueue]);

  const getCurrentAnimationTask = useCallback(() => {
    return state.context.animationQueue[0] || null;
  }, [state.context.animationQueue]);

  // Validation
  const isValidElement = useCallback(
    (elementId: string): boolean => {
      return state.context.enrichedElements.some((el) => el.id === elementId);
    },
    [state.context.enrichedElements],
  );

  const canToggleBreaker = useCallback(
    (elementId: string): boolean => {
      const element = getElementData(elementId);
      return element?.type === 'breaker' && element.equipmentId != null;
    },
    [getElementData],
  );

  // Debug
  const getDebugInfo = useCallback(() => {
    return {
      state: mainState,
      subState,
      elementCount: getElementCount(),
      selectedCount: getSelectedCount(),
      animationQueueLength: getAnimationQueueLength(),
      isInitialized: state.context.isInitialized,
      hasError: state.context.renderError != null,
      config: state.context.config,
    };
  }, [
    mainState,
    subState,
    getElementCount,
    getSelectedCount,
    getAnimationQueueLength,
    state.context.isInitialized,
    state.context.renderError,
    state.context.config,
  ]);

  // ===== RETURN DE L'INTERFACE =====

  return {
    // État actuel
    state: mainState as any,
    subState,

    // États calculés
    isUninitialized: state.matches('uninitialized'),
    isIdle: state.matches('idle'),
    isEnriching: state.matches('enriching'),
    isRendering: state.matches('rendering'),
    isReady: state.matches('ready'),
    isError: state.matches('error'),
    isInteractive: state.matches('ready.interactive'),
    isAnimating:
      state.matches('ready.animating') ||
      state.matches('ready.processingAnimation'),

    // Données de rendu
    diagramData: state.context.diagramData,
    enrichedElements: state.context.enrichedElements,
    selectedElements: state.context.selectedElements,
    hoveredElement: state.context.hoveredElement,
    contextMenuTarget: state.context.contextMenuTarget,

    // Configuration
    config: state.context.config,

    // État SVG
    isInitialized: state.context.isInitialized,
    currentTransform: state.context.currentTransform,

    // Animation
    animationQueue: state.context.animationQueue,
    isAnimatingState: state.context.isAnimating,

    // Erreurs
    renderError: state.context.renderError,

    // Actions de base
    initialize,
    setConfig,
    setDiagramData,
    updateDiagramData,
    clearDiagram,

    // Interactions utilisateur
    clickElement,
    hoverElement,
    contextMenuElement,
    clickCanvas,
    clearSelection,
    toggleBreaker,
    selectElements,
    deselectElements,

    // Gestion du zoom
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToSelection,
    resetZoom,
    setZoom,

    // Animations
    skipAnimations,

    // Gestion d'erreur
    clearError,

    // Helpers
    getElementData,
    getElementsByType,
    getSelectedElementsData,
    getBreakers,
    getOpenBreakers,
    getClosedBreakers,
    getElementCount,
    getSelectedCount,
    getAnimationQueueLength,
    hasActiveAnimations,
    getCurrentAnimationTask,
    isValidElement,
    canToggleBreaker,
    getDebugInfo,
  };
};

// ===== HOOK AVEC CONFIGURATION PAR DÉFAUT =====

export const useDiagramRenderer = (initialConfig?: Partial<DiagramConfig>) => {
  const store = useDiagramRendererStore();

  // Appliquer la configuration initiale si fournie
  React.useEffect(() => {
    if (initialConfig && store.isIdle) {
      store.setConfig(initialConfig);
    }
  }, [initialConfig, store.isIdle, store.setConfig]);

  return store;
};

// ===== TYPES UTILITAIRES =====

export type DiagramRendererState = DiagramRendererStore['state'];
export type DiagramElement = ElementData;

// ===== CONSTANTS =====

export const DIAGRAM_RENDERER_STATES = {
  UNINITIALIZED: 'uninitialized' as const,
  IDLE: 'idle' as const,
  ENRICHING: 'enriching' as const,
  RENDERING: 'rendering' as const,
  READY: 'ready' as const,
  ERROR: 'error' as const,
} as const;

export const DIAGRAM_RENDERER_SUB_STATES = {
  INTERACTIVE: 'interactive' as const,
  ANIMATING: 'animating' as const,
  PROCESSING_ANIMATION: 'processingAnimation' as const,
} as const;
