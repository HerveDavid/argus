import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';

// Types
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetElement: SVGElement | null;
}

interface ElementInfo {
  tagName: string;
  id: string;
  classes: string[];
  attributes: { name: string; value: string }[];
  text: string;
  isBreaker: boolean;
  isDisconnector: boolean;
  isLoad: boolean;
  isWire: boolean;
  isLabel: boolean;
  isClosed: boolean;
  isOpen: boolean;
  isDisconnected: boolean;
}

// Utilitaires
const findParentWithId = (element: SVGElement): SVGElement | null => {
  let current = element;
  while (current && current.parentElement) {
    if (current.id && current.id.trim() !== '') {
      return current;
    }
    current = current.parentElement as unknown as SVGElement;
  }
  return null;
};

const getElementInfo = (element: SVGElement | null): ElementInfo => {
  if (!element) {
    return {
      tagName: '',
      id: '',
      classes: [],
      attributes: [],
      text: '',
      isBreaker: false,
      isDisconnector: false,
      isLoad: false,
      isWire: false,
      isLabel: false,
      isClosed: false,
      isOpen: false,
      isDisconnected: false,
    };
  }

  const classList =
    element
      .getAttribute('class')
      ?.split(' ')
      .filter((c) => c.trim()) || [];
  const attributes: { name: string; value: string }[] = [];

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes.push({ name: attr.name, value: attr.value });
  }

  return {
    tagName: element.tagName,
    id: element.id || '',
    classes: classList,
    attributes,
    text: element.textContent || '',
    isBreaker: classList.includes('sld-breaker'),
    isDisconnector: classList.includes('sld-disconnector'),
    isLoad: classList.includes('sld-load'),
    isWire: classList.includes('sld-wire'),
    isLabel: classList.includes('sld-label'),
    isClosed: classList.includes('sld-closed'),
    isOpen: classList.includes('sld-open'),
    isDisconnected: classList.includes('sld-disconnected'),
  };
};

// Hook pour le menu contextuel
export const useContextMenu = (svgContainerRef: React.RefObject<HTMLDivElement>) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetElement: null,
  });

  const lastCallTimeRef = useRef<number>(0);
  const throttleDelayMs = 100;

  const handleContextMenu = useCallback(
    (
      e: Event,
      isLabelClick = false,
      labelElement: SVGElement | null = null,
    ) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastCallTimeRef.current < throttleDelayMs) {
        return;
      }
      lastCallTimeRef.current = now;

      const mouseEvent = e as MouseEvent;
      const containerRect = svgContainerRef.current?.getBoundingClientRect();

      if (containerRect) {
        const relativeX = mouseEvent.clientX - containerRect.left;
        const relativeY = mouseEvent.clientY - containerRect.top;

        const targetElement = isLabelClick
          ? labelElement
          : (e.target as SVGElement | null);
        let element: SVGElement | null = targetElement;

        if (!isLabelClick && element) {
          const foundParent = findParentWithId(element);
          element = foundParent as SVGElement | null;
        }

        setContextMenu({
          visible: true,
          x: relativeX,
          y: relativeY,
          targetElement: element || targetElement,
        });
      }
    },
    [svgContainerRef],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  return { contextMenu, handleContextMenu, closeContextMenu, setContextMenu };
};

// Composant Menu Contextuel
interface ContextMenuProps {
  contextMenu: ContextMenuState;
  onClose: () => void;
  onToggleSwitch?: (elementId: string, currentState: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  onClose,
  onToggleSwitch,
  containerRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const elementInfo = useMemo(
    () => getElementInfo(contextMenu.targetElement),
    [contextMenu.targetElement],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu.visible, onClose]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copié dans le presse-papiers:', text);
    });
  };

  const handleCopyAttribute = (name: string, value: string) => {
    handleCopyToClipboard(`${name}="${value}"`);
  };

  const handleCopyElement = () => {
    if (!contextMenu.targetElement) return;

    const element = contextMenu.targetElement;
    const tagName = element.tagName;
    let attributesText = '';

    elementInfo.attributes.forEach((attr) => {
      attributesText += ` ${attr.name}="${attr.value}"`;
    });

    handleCopyToClipboard(`<${tagName}${attributesText} />`);
  };

  const handleToggleElement = () => {
    if (!contextMenu.targetElement || !onToggleSwitch) return;

    if (elementInfo.isBreaker || elementInfo.isDisconnector) {
      onToggleSwitch(elementInfo.id, elementInfo.isClosed);
    }
  };

  const getStatusColor = () => {
    if (elementInfo.isDisconnected) return 'text-gray-500';
    if (elementInfo.isClosed) return 'text-green-600';
    if (elementInfo.isOpen) return 'text-red-600';
    return 'text-blue-600';
  };

  const getStatusText = () => {
    if (elementInfo.isDisconnected) return 'Déconnecté';
    if (elementInfo.isClosed) return 'Fermé';
    if (elementInfo.isOpen) return 'Ouvert';
    return 'Connecté';
  };

  if (!contextMenu.visible) return null;

  // Calcul de la position pour éviter que le menu sorte de l'écran
  const containerRect = containerRef.current?.getBoundingClientRect();
  const menuWidth = 350;
  const menuHeight = 400;

  let adjustedX = contextMenu.x;
  let adjustedY = contextMenu.y;

  if (containerRect) {
    if (contextMenu.x + menuWidth > containerRect.width) {
      adjustedX = contextMenu.x - menuWidth;
    }
    if (contextMenu.y + menuHeight > containerRect.height) {
      adjustedY = contextMenu.y - menuHeight;
    }
  }

  return (
    <div
      ref={menuRef}
      className="absolute bg-white shadow-lg rounded-lg border border-gray-200 py-2 z-50 text-sm"
      style={{
        left: adjustedX,
        top: adjustedY,
        maxWidth: `${menuWidth}px`,
        maxHeight: `${menuHeight}px`,
      }}
    >
      {/* En-tête avec type d'élément et état */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-blue-600">
            {elementInfo.tagName}
          </span>
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {elementInfo.id && (
          <div
            className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-blue-500 truncate"
            onClick={() => handleCopyToClipboard(elementInfo.id)}
            title="Cliquer pour copier l'ID"
          >
            #{elementInfo.id}
          </div>
        )}

        {/* Classes CSS */}
        {elementInfo.classes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {elementInfo.classes.map((cls, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs cursor-pointer hover:bg-gray-200"
                onClick={() => handleCopyToClipboard(cls)}
                title="Cliquer pour copier"
              >
                {cls}
              </span>
            ))}
          </div>
        )}

        {/* Texte pour les labels */}
        {elementInfo.isLabel && elementInfo.text && (
          <div
            className="mt-2 text-sm italic text-gray-700 cursor-pointer hover:text-blue-500 truncate"
            title="Cliquer pour copier le texte"
            onClick={() => handleCopyToClipboard(elementInfo.text)}
          >
            "{elementInfo.text}"
          </div>
        )}
      </div>

      {/* Actions spécifiques */}
      <div className="py-1">
        {(elementInfo.isBreaker || elementInfo.isDisconnector) && (
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            onClick={handleToggleElement}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
            {elementInfo.isClosed ? 'Ouvrir' : 'Fermer'}{' '}
            {elementInfo.isBreaker ? 'le disjoncteur' : 'le sectionneur'}
          </div>
        )}
      </div>

      {/* Attributs */}
      <div className="border-t border-gray-100">
        <div className="px-4 py-2 text-xs text-gray-500 font-semibold">
          ATTRIBUTS ({elementInfo.attributes.length})
        </div>
        <div className="max-h-40 overflow-y-auto">
          {elementInfo.attributes.map((attr, index) => (
            <div
              key={index}
              className="px-4 py-1 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              onClick={() => handleCopyAttribute(attr.name, attr.value)}
              title="Cliquer pour copier"
            >
              <span className="font-medium text-purple-700 text-xs">
                {attr.name}:
              </span>
              <span className="text-gray-600 text-xs truncate max-w-48 ml-2">
                {attr.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions de copie */}
      <div className="border-t border-gray-100 pt-1">
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
          onClick={handleCopyElement}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copier l'élément
        </div>

        {elementInfo.id && (
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            onClick={() => handleCopyToClipboard(elementInfo.id)}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
            Copier l'ID
          </div>
        )}

        {elementInfo.text && (
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            onClick={() => handleCopyToClipboard(elementInfo.text)}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Copier le texte
          </div>
        )}
      </div>
    </div>
  );
};
