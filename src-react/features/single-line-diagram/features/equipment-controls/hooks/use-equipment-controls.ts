import React, { useCallback, useState } from 'react';

export const useEquipmentControls = () => {
  const [targetElement, setTargetElement] = useState<SVGElement | null>(null);

  const handleContextMenuTrigger = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      let element: SVGElement | null = e.target as SVGElement;

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
