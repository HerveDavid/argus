import { useState } from 'react';

export const useContextMenuState = (targetElement: SVGElement | null) => {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  const handleContextMenuOpenChange = (open: boolean) => {
    setContextMenuOpen(open);

    // Reset si le menu se ferme et qu'il n'y a pas de targetElement
    if (!open && !targetElement) {
      // Cette logique sera gérée par useElementInfo
    }
  };

  return {
    contextMenuOpen,
    handleContextMenuOpenChange,
  };
};
