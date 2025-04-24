import { useEffect, useState, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  targetElement: SVGElement | null;
  onClose: () => void;
  onToggleBreaker?: (breakerId: string, isClosed: boolean) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  targetElement,
  onClose,
  onToggleBreaker,
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
    isBreaker: boolean;
    isClosed: boolean;
  }>({
    tagName: '',
    id: '',
    classes: [],
    isLabel: false,
    text: '',
    isBreaker: false,
    isClosed: false,
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
      const isBreaker = classList.includes('sld-breaker');
      const isClosed = classList.includes('sld-closed');
      const text = targetElement.textContent || '';

      setElementInfo({
        tagName,
        id,
        classes: classList,
        isLabel,
        text,
        isBreaker,
        isClosed,
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

  const handleToggleBreaker = () => {
    if (elementInfo.isBreaker && targetElement && onToggleBreaker) {
      onToggleBreaker(elementInfo.id, elementInfo.isClosed);
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
        {elementInfo.isBreaker && (
          <div
            className="px-4 py-1.5 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
            onClick={handleToggleBreaker}
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {elementInfo.isClosed
              ? 'Ouvrir le disjoncteur'
              : 'Fermer le disjoncteur'}
          </div>
        )}

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

export default ContextMenu;
