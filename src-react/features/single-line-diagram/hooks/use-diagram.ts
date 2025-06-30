import { useEffect, useCallback, useMemo } from 'react';
import { useSldStore } from '../stores/sld.store';
import {
  useDiagramRenderer,
  DiagramConfig,
} from '../stores/diagram-render.store';

// ===== TYPES =====

interface DiagramIntegrationConfig extends Partial<DiagramConfig> {
  // Configuration spécifique à l'intégration
  autoLoadOnDataChange?: boolean;
  syncSelection?: boolean;
  enableRealTimeUpdates?: boolean;
  updateInterval?: number; // en millisecondes
}

interface DiagramIntegrationCallbacks {
  onBreakerToggle?: (breakerId: string, isOpen: boolean) => void;
  onElementSelect?: (elementIds: string[]) => void;
  onElementHover?: (elementId: string | null) => void;
  onDiagramLoad?: (lineId: string) => void;
  onDiagramError?: (error: string) => void;
}

interface DiagramIntegrationResult {
  // Stores
  sld: ReturnType<typeof useSldStore>;
  renderer: ReturnType<typeof useDiagramRenderer>;

  // État consolidé
  isLoading: boolean;
  isReady: boolean;
  hasError: boolean;
  errorMessage: string | null;

  // Actions consolidées
  loadDiagram: (lineId: string) => void;
  clearDiagram: () => void;
  refreshDiagram: () => void;

  // Contrôles du rendu
  enableAnimations: () => void;
  disableAnimations: () => void;
  skipCurrentAnimations: () => void;

  // Contrôles du zoom
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;

  // Informations sur les éléments
  getSelectedElements: () => string[];
  getElementCount: () => number;
  getBreakersInfo: () => {
    total: number;
    open: number;
    closed: number;
  };

  // Debug et monitoring
  getPerformanceInfo: () => {
    dataLoadTime: number | null;
    renderTime: number | null;
    elementCount: number;
    animationQueueLength: number;
  };
}

// ===== HOOK PRINCIPAL =====

export const useDiagramIntegration = (
  config: DiagramIntegrationConfig = {},
  callbacks: DiagramIntegrationCallbacks = {},
): DiagramIntegrationResult => {
  const {
    autoLoadOnDataChange = true,
    syncSelection = true,
    enableRealTimeUpdates = false,
    updateInterval = 5000,
    ...rendererConfig
  } = config;

  const {
    onBreakerToggle,
    onElementSelect,
    onElementHover,
    onDiagramLoad,
    onDiagramError,
  } = callbacks;

  // Initialiser les stores
  const sld = useSldStore();
  const renderer = useDiagramRenderer(rendererConfig);

  // ===== SYNCHRONISATION DES DONNÉES =====

  // Synchroniser les données SLD vers le renderer
  useEffect(() => {
    if (!autoLoadOnDataChange) return;

    if (sld.diagramData && sld.isLoaded) {
      if (renderer.isIdle) {
        renderer.setDiagramData(sld.diagramData);
      } else if (renderer.isReady) {
        renderer.updateDiagramData(sld.diagramData);
      }
    } else if (
      !sld.diagramData &&
      !renderer.isIdle &&
      !renderer.isUninitialized
    ) {
      renderer.clearDiagram();
    }
  }, [
    sld.diagramData,
    sld.isLoaded,
    renderer.isIdle,
    renderer.isReady,
    renderer.isUninitialized,
    autoLoadOnDataChange,
    renderer.setDiagramData,
    renderer.updateDiagramData,
    renderer.clearDiagram,
  ]);

  // ===== GESTION DES CALLBACKS =====

  // Callback pour le toggle des breakers
  const handleBreakerToggle = useCallback(
    (breakerId: string, isOpen: boolean) => {
      onBreakerToggle?.(breakerId, isOpen);
    },
    [onBreakerToggle],
  );

  // Callback pour la sélection
  const handleElementSelect = useCallback(
    (elementIds: string[]) => {
      onElementSelect?.(elementIds);
    },
    [onElementSelect],
  );

  // Callback pour le hover
  const handleElementHover = useCallback(
    (elementId: string | null) => {
      onElementHover?.(elementId);
    },
    [onElementHover],
  );

  // ===== GESTION DES ERREURS =====

  useEffect(() => {
    if (sld.error) {
      onDiagramError?.(sld.error);
    }
  }, [sld.error, onDiagramError]);

  useEffect(() => {
    if (renderer.renderError) {
      onDiagramError?.(renderer.renderError);
    }
  }, [renderer.renderError, onDiagramError]);

  // ===== MISES À JOUR EN TEMPS RÉEL =====

  useEffect(() => {
    if (!enableRealTimeUpdates || !sld.lineId) return;

    const interval = setInterval(() => {
      if (sld.isLoaded && !sld.isRefreshing) {
        sld.manualRefresh();
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [
    enableRealTimeUpdates,
    sld.lineId,
    sld.isLoaded,
    sld.isRefreshing,
    sld.manualRefresh,
    updateInterval,
  ]);

  // ===== NOTIFICATION DE CHARGEMENT =====

  useEffect(() => {
    if (sld.lineId && sld.isLoaded) {
      onDiagramLoad?.(sld.lineId);
    }
  }, [sld.lineId, sld.isLoaded, onDiagramLoad]);

  // ===== ACTIONS CONSOLIDÉES =====

  const loadDiagram = useCallback(
    (lineId: string) => {
      sld.loadDiagram(lineId);
    },
    [sld.loadDiagram],
  );

  const clearDiagram = useCallback(() => {
    sld.clearDiagram();
    renderer.clearDiagram();
  }, [sld.clearDiagram, renderer.clearDiagram]);

  const refreshDiagram = useCallback(() => {
    if (sld.lineId) {
      sld.manualRefresh();
    }
  }, [sld.lineId, sld.manualRefresh]);

  // ===== CONTRÔLES DU RENDU =====

  const enableAnimations = useCallback(() => {
    renderer.setConfig({ enableAnimations: true });
  }, [renderer.setConfig]);

  const disableAnimations = useCallback(() => {
    renderer.setConfig({ enableAnimations: false });
  }, [renderer.setConfig]);

  const skipCurrentAnimations = useCallback(() => {
    renderer.skipAnimations();
  }, [renderer.skipAnimations]);

  // ===== CONTRÔLES DU ZOOM =====

  const zoomIn = useCallback(() => {
    renderer.zoomIn();
  }, [renderer.zoomIn]);

  const zoomOut = useCallback(() => {
    renderer.zoomOut();
  }, [renderer.zoomOut]);

  const zoomToFit = useCallback(() => {
    renderer.zoomToFit();
  }, [renderer.zoomToFit]);

  const resetZoom = useCallback(() => {
    renderer.resetZoom();
  }, [renderer.resetZoom]);

  // ===== INFORMATIONS SUR LES ÉLÉMENTS =====

  const getSelectedElements = useCallback((): string[] => {
    return Array.from(renderer.selectedElements);
  }, [renderer.selectedElements]);

  const getElementCount = useCallback((): number => {
    return renderer.getElementCount();
  }, [renderer.getElementCount]);

  const getBreakersInfo = useCallback(() => {
    const breakers = renderer.getBreakers();
    const openBreakers = renderer.getOpenBreakers();
    const closedBreakers = renderer.getClosedBreakers();

    return {
      total: breakers.length,
      open: openBreakers.length,
      closed: closedBreakers.length,
    };
  }, [
    renderer.getBreakers,
    renderer.getOpenBreakers,
    renderer.getClosedBreakers,
  ]);

  // ===== INFORMATIONS DE PERFORMANCE =====

  const getPerformanceInfo = useCallback(() => {
    const timeSinceLastUpdate = sld.getTimeSinceLastUpdate();

    return {
      dataLoadTime: timeSinceLastUpdate,
      renderTime: null, // À implémenter si nécessaire
      elementCount: renderer.getElementCount(),
      animationQueueLength: renderer.getAnimationQueueLength(),
    };
  }, [
    sld.getTimeSinceLastUpdate,
    renderer.getElementCount,
    renderer.getAnimationQueueLength,
  ]);

  // ===== ÉTAT CONSOLIDÉ =====

  const consolidatedState = useMemo(() => {
    const isLoading =
      sld.isLoading ||
      sld.isRefreshing ||
      renderer.isEnriching ||
      renderer.isRendering;
    const isReady = sld.isLoaded && renderer.isReady;
    const hasError = sld.isError || renderer.isError;
    const errorMessage = sld.error || renderer.renderError;

    return {
      isLoading,
      isReady,
      hasError,
      errorMessage,
    };
  }, [
    sld.isLoading,
    sld.isRefreshing,
    sld.isLoaded,
    sld.isError,
    sld.error,
    renderer.isEnriching,
    renderer.isRendering,
    renderer.isReady,
    renderer.isError,
    renderer.renderError,
  ]);

  // ===== RETOUR DU HOOK =====

  return {
    // Stores
    sld,
    renderer,

    // État consolidé
    ...consolidatedState,

    // Actions consolidées
    loadDiagram,
    clearDiagram,
    refreshDiagram,

    // Contrôles du rendu
    enableAnimations,
    disableAnimations,
    skipCurrentAnimations,

    // Contrôles du zoom
    zoomIn,
    zoomOut,
    zoomToFit,
    resetZoom,

    // Informations sur les éléments
    getSelectedElements,
    getElementCount,
    getBreakersInfo,

    // Debug et monitoring
    getPerformanceInfo,
  };
};

// ===== HOOKS SPÉCIALISÉS =====

// Hook pour l'auto-refresh avec contrôle fin
export const useDiagramAutoRefresh = (
  lineId: string | null,
  options: {
    enabled?: boolean;
    interval?: number;
    onlyWhenVisible?: boolean;
  } = {},
) => {
  const { enabled = false, interval = 5000, onlyWhenVisible = true } = options;
  const sld = useSldStore();

  useEffect(() => {
    if (!enabled || !lineId || !sld.isLoaded) return;

    let intervalId: NodeJS.Timeout;

    const refresh = () => {
      // Vérifier si la page est visible (si option activée)
      if (onlyWhenVisible && document.hidden) return;

      if (!sld.isRefreshing) {
        sld.manualRefresh();
      }
    };

    intervalId = setInterval(refresh, interval);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    enabled,
    lineId,
    interval,
    onlyWhenVisible,
    sld.isLoaded,
    sld.isRefreshing,
    sld.manualRefresh,
  ]);

  return {
    enableAutoRefresh: sld.enableAutoRefresh,
    disableAutoRefresh: sld.disableAutoRefresh,
    isAutoRefreshEnabled: sld.isAutoRefreshEnabled,
    lastUpdate: sld.lastUpdate,
    timeSinceLastUpdate: sld.getTimeSinceLastUpdate(),
  };
};

// Hook pour la gestion des selections avec persistance
export const useDiagramSelection = (
  renderer: ReturnType<typeof useDiagramRenderer>,
  options: {
    persistSelection?: boolean;
    maxSelection?: number;
    allowMultiSelect?: boolean;
  } = {},
) => {
  const {
    persistSelection = false,
    maxSelection = 10,
    allowMultiSelect = true,
  } = options;

  const selectElements = useCallback(
    (elementIds: string[], replace = false) => {
      if (!allowMultiSelect || replace) {
        renderer.clearSelection();
      }

      const currentSelection = Array.from(renderer.selectedElements);
      const newSelection = [...currentSelection, ...elementIds];

      // Respecter la limite de sélection
      const limitedSelection = newSelection.slice(-maxSelection);

      // Appliquer la sélection
      renderer.selectElements(limitedSelection);
    },
    [renderer, allowMultiSelect, maxSelection],
  );

  const deselectElements = useCallback(
    (elementIds: string[]) => {
      renderer.deselectElements(elementIds);
    },
    [renderer],
  );

  const clearSelection = useCallback(() => {
    renderer.clearSelection();
  }, [renderer]);

  const toggleElementSelection = useCallback(
    (elementId: string) => {
      if (renderer.selectedElements.has(elementId)) {
        deselectElements([elementId]);
      } else {
        selectElements([elementId], !allowMultiSelect);
      }
    },
    [
      renderer.selectedElements,
      selectElements,
      deselectElements,
      allowMultiSelect,
    ],
  );

  const selectByType = useCallback(
    (type: string) => {
      const elementsOfType = renderer.getElementsByType(type as any);
      const elementIds = elementsOfType.map((el) => el.id);
      selectElements(elementIds, true);
    },
    [renderer, selectElements],
  );

  const getSelectionInfo = useCallback(() => {
    const selectedElements = renderer.getSelectedElementsData();
    const typeCount = selectedElements.reduce(
      (acc, el) => {
        acc[el.type] = (acc[el.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      count: selectedElements.length,
      elements: selectedElements,
      typeCount,
      hasBreakers: selectedElements.some((el) => el.type === 'breaker'),
      hasWires: selectedElements.some((el) => el.type === 'wire'),
    };
  }, [renderer]);

  // Persistance de la sélection (localStorage)
  useEffect(() => {
    if (!persistSelection) return;

    const selectedIds = Array.from(renderer.selectedElements);
    if (selectedIds.length > 0) {
      localStorage.setItem('diagram-selection', JSON.stringify(selectedIds));
    } else {
      localStorage.removeItem('diagram-selection');
    }
  }, [renderer.selectedElements, persistSelection]);

  return {
    selectedElements: renderer.selectedElements,
    selectElements,
    deselectElements,
    clearSelection,
    toggleElementSelection,
    selectByType,
    getSelectionInfo,
  };
};

// ===== TYPES EXPORTÉS =====

export type {
  DiagramIntegrationConfig,
  DiagramIntegrationCallbacks,
  DiagramIntegrationResult,
};
