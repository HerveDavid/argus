import { useState, useCallback } from 'react';

export const useEquipmentControls = () => {
  const [targetElement, setTargetElement] = useState<SVGElement | null>(null);

  const handleContextMenuTrigger = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const target = e.target as SVGElement;
      let element: SVGElement | null = target;

      // Find parent with id
      while (
        element &&
        !element.id &&
        element.parentElement instanceof SVGElement
      ) {
        element = element.parentElement;
      }

      setTargetElement(element?.id ? element : null);
    },
    [],
  );

  return {
    targetElement,
    handleContextMenuTrigger,
  };
};
