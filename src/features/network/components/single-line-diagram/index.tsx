import { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../stores/use-diagram.store';
import * as d3 from 'd3';

interface SingleLineDiagramProps {
  lineId: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  targetElement: SVGElement | null;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  targetElement,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [attributes, setAttributes] = useState<
    { name: string; value: string }[]
  >([]);
  const [elementInfo, setElementInfo] = useState<{
    tagName: string;
    id: string;
    classes: string[];
    isLabel: boolean;
    text: string;
  }>({
    tagName: '',
    id: '',
    classes: [],
    isLabel: false,
    text: '',
  });

  useEffect(() => {
    // Get all attributes and info of the target element
    if (targetElement) {
      // Get attributes
      const attrs: { name: string; value: string }[] = [];
      for (let i = 0; i < targetElement.attributes.length; i++) {
        const attr = targetElement.attributes[i];
        attrs.push({ name: attr.name, value: attr.value });
      }
      setAttributes(attrs);

      // Get element info
      const tagName = targetElement.tagName;
      const id = targetElement.id || '';
      const classList = targetElement.getAttribute('class')?.split(' ') || [];
      const isLabel = classList.includes('sld-label');
      const text = targetElement.textContent || '';

      setElementInfo({
        tagName,
        id,
        classes: classList,
        isLabel,
        text,
      });
    }

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [targetElement, onClose]);

  const handleCopyAttribute = (name: string, value: string) => {
    navigator.clipboard.writeText(`${name}="${value}"`);
  };

  const handleCopyElementInfo = () => {
    if (!targetElement) return;

    const tagName = targetElement.tagName;
    let attributesText = '';

    attributes.forEach((attr) => {
      attributesText += ` ${attr.name}="${attr.value}"`;
    });

    navigator.clipboard.writeText(`<${tagName}${attributesText} />`);
  };

  const handleCopyId = () => {
    if (elementInfo.id) {
      navigator.clipboard.writeText(elementInfo.id);
    }
  };

  const handleCopyText = () => {
    if (elementInfo.text) {
      navigator.clipboard.writeText(elementInfo.text);
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute bg-white shadow-lg rounded-md border border-gray-200 py-2 z-50"
      style={{
        left: x,
        top: y,
        maxWidth: '350px',
        maxHeight: '500px',
        // Éviter que le menu ne sorte de l'écran
        transform: `translate(${x > window.innerWidth - 350 ? '-100%' : '0'}, ${
          y > window.innerHeight - 300 ? '-100%' : '0'
        })`,
      }}
    >
      {/* Header with element type and id if available */}
      <div className="px-4 py-2 font-semibold text-sm border-b border-gray-100 flex flex-col">
        <div className="flex justify-between items-center">
          <span className="text-blue-600">{elementInfo.tagName}</span>
          {elementInfo.id && (
            <span
              className="text-gray-500 text-xs ml-2 hover:text-blue-500 cursor-pointer"
              onClick={handleCopyId}
              title="Cliquer pour copier l'ID"
            >
              #{elementInfo.id}
            </span>
          )}
        </div>

        {/* Display classes in a badge style */}
        {elementInfo.classes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {elementInfo.classes.map((cls, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {cls}
              </span>
            ))}
          </div>
        )}

        {/* Show text content for labels */}
        {elementInfo.isLabel && elementInfo.text && (
          <div
            className="mt-1.5 text-sm italic truncate cursor-pointer hover:text-blue-500"
            title="Cliquer pour copier le texte"
            onClick={handleCopyText}
          >
            "{elementInfo.text}"
          </div>
        )}
      </div>

      {/* Attributes section */}
      {attributes.length > 0 ? (
        <div className="max-h-60 overflow-y-auto">
          <div className="px-4 py-1 text-xs text-gray-500 font-semibold">
            ATTRIBUTS:
          </div>
          {attributes.map((attr, index) => (
            <div
              key={index}
              className="px-4 py-1 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
              onClick={() => handleCopyAttribute(attr.name, attr.value)}
              title="Cliquer pour copier"
            >
              <span className="font-medium text-purple-700">{attr.name}:</span>
              <span className="ml-2 text-gray-600 truncate max-w-xs">
                {attr.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-1 text-sm text-gray-500">Aucun attribut</div>
      )}

      {/* Actions section */}
      <div className="border-t border-gray-100 mt-1 pt-1">
        <div
          className="px-4 py-1.5 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
          onClick={handleCopyElementInfo}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copier l'élément entier
        </div>

        {elementInfo.id && (
          <div
            className="px-4 py-1.5 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
            onClick={handleCopyId}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        {elementInfo.isLabel && elementInfo.text && (
          <div
            className="px-4 py-1.5 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
            onClick={handleCopyText}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  lineId,
  width = '100%',
  height = 'auto',
  className = '',
}: SingleLineDiagramProps) => {
  const { svgBlob, isLoading, error, loadDiagram, resetDiagram } =
    useDiagramStore();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetElement: SVGElement | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetElement: null,
  });

  useEffect(() => {
    loadDiagram(lineId);
    return () => {
      resetDiagram();
    };
  }, [lineId, loadDiagram, resetDiagram]);

  useEffect(() => {
    if (svgBlob) {
      svgBlob.text().then((text) => {
        setSvgContent(text);
      });
    } else {
      setSvgContent(null);
    }
  }, [svgBlob]);

  // Simple effect to make the SVG fit perfectly within the card container
  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      const svgElement = svgContainerRef.current.querySelector('svg');

      if (svgElement) {
        // Ensure that the SVG fits perfectly within the card container
        d3.select(svgElement)
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('preserveAspectRatio', 'xMidYMid meet')
          .style('max-width', '100%')
          .style('max-height', '100%')
          .style('overflow', 'hidden');

        // Find the existing viewBox or create one if necessary
        const viewBox = svgElement.getAttribute('viewBox');
        if (!viewBox) {
          const bbox = (svgElement as SVGSVGElement).getBBox();
          // Add some padding to ensure content is visible
          const padding = 5;
          svgElement.setAttribute(
            'viewBox',
            `${bbox.x - padding} ${bbox.y - padding} ${
              bbox.width + padding * 2
            } ${bbox.height + padding * 2}`,
          );
        }

        // Make sure the SVG scales to fit the container perfectly
        const containerWidth = svgContainerRef.current.clientWidth;
        const containerHeight = svgContainerRef.current.clientHeight;

        if (containerWidth && containerHeight) {
          // Set viewBox to maintain aspect ratio while fitting perfectly
          const currentViewBox = svgElement
            .getAttribute('viewBox')
            ?.split(' ')
            .map(Number) || [0, 0, 100, 100];
          const viewBoxWidth = currentViewBox[2];
          const viewBoxHeight = currentViewBox[3];

          const svgAspectRatio = viewBoxWidth / viewBoxHeight;
          const containerAspectRatio = containerWidth / containerHeight;

          if (containerAspectRatio > svgAspectRatio) {
            // Container is wider than SVG
            const newWidth = viewBoxHeight * containerAspectRatio;
            const xOffset = (newWidth - viewBoxWidth) / 2;
            svgElement.setAttribute(
              'viewBox',
              `${currentViewBox[0] - xOffset} ${
                currentViewBox[1]
              } ${newWidth} ${viewBoxHeight}`,
            );
          } else {
            // Container is taller than SVG
            const newHeight = viewBoxWidth / containerAspectRatio;
            const yOffset = (newHeight - viewBoxHeight) / 2;
            svgElement.setAttribute(
              'viewBox',
              `${currentViewBox[0]} ${
                currentViewBox[1] - yOffset
              } ${viewBoxWidth} ${newHeight}`,
            );
          }
        }
      }

      // Add context menu event listener to SVG elements and hover effect to labels
      const addEventListeners = () => {
        if (svgContainerRef.current) {
          // Add context menu to all SVG elements
          const svgElements =
            svgContainerRef.current.querySelectorAll('svg, svg *');
          svgElements.forEach((element) => {
            element.addEventListener(
              'contextmenu',
              handleContextMenu as EventListener,
            );
          });

          // Add hover effect to sld-label elements
          const labelElements =
            svgContainerRef.current.querySelectorAll('.sld-label');
          labelElements.forEach((label) => {
            // Save original style
            const originalFill = label.getAttribute('fill') || 'black';
            const originalFont = label.getAttribute('font') || '';

            // Add hover effects
            label.addEventListener('mouseenter', () => {
              label.setAttribute('fill', '#FF5500');
              label.setAttribute('font-weight', 'bold');
              // Fix type error by checking if the element has style property
              if (label instanceof SVGElement || label instanceof HTMLElement) {
                label.style.cursor = 'pointer';
              }
            });

            label.addEventListener('mouseleave', () => {
              label.setAttribute('fill', originalFill);
              label.setAttribute('font-weight', 'normal');
              if (originalFont) {
                label.setAttribute('font', originalFont);
              }
            });

            // Add click event for labels
            label.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();

              // Get the text content of the label
              const labelText: string = label.textContent;

              // Show a small tooltip or perform an action when label is clicked
              // For now, we'll use the context menu functionality
              handleContextMenu(e, true, label as SVGElement, labelText);
            });
          });
        }
      };

      // Add all event listeners
      addEventListeners();

      // Cleanup function
      return () => {
        if (svgContainerRef.current) {
          const svgElements =
            svgContainerRef.current.querySelectorAll('svg, svg *');

          svgElements.forEach((element) => {
            element.removeEventListener(
              'contextmenu',
              handleContextMenu as EventListener,
            );
          });
        }
      };
    }
  }, [svgContent]);

  // Handle context menu events (right-click or label click)
  const handleContextMenu = (
    e: Event,
    isLabelClick = false,
    labelElement: SVGElement | null = null,
    labelText = '',
  ) => {
    e.preventDefault();
    const mouseEvent = e as MouseEvent;

    // Obtenir les coordonnées relatives au conteneur SVG
    const containerRect = svgContainerRef.current?.getBoundingClientRect();

    if (containerRect) {
      // Calculer les coordonnées relatives au conteneur
      const relativeX = mouseEvent.clientX - containerRect.left;
      const relativeY = mouseEvent.clientY - containerRect.top;

      // Si c'est un clic sur un label, utiliser le label comme target
      // sinon utiliser l'élément ciblé par l'événement
      const targetElement = isLabelClick
        ? labelElement
        : (e.target as SVGElement | null);

      // Trouver le parent le plus proche qui contient un ID si le target n'est pas un label
      let element: SVGElement | null = targetElement;
      if (!isLabelClick && element) {
        while (element && !element.id && element.parentElement) {
          element = element.parentElement as SVGElement;
        }
      }

      setContextMenu({
        visible: true,
        x: relativeX,
        y: relativeY,
        targetElement: element || targetElement,
      });
    }
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        Loading diagram...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (svgContent) {
    return (
      <div
        ref={svgContainerRef}
        className={`relative ${className}`}
        style={{
          width,
          height,
          overflow: 'hidden', // Prevents overflow
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />

        {contextMenu.visible && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            targetElement={contextMenu.targetElement}
            onClose={closeContextMenu}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-40 text-gray-500">
      <p>Forbidden diagram</p>
      <button
        className="mt-2 px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        onClick={() => loadDiagram(lineId)}
      >
        Reload
      </button>
    </div>
  );
};

export default SingleLineDiagram;
