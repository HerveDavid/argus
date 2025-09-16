import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';
import React, { useEffect, useRef, useState } from 'react';

import './styles/gradients.css';
import { SettingsMenu } from '@/app/layouts/state-view/header/settings-menu.tsx';
import { useHeaderStore } from '@/app/layouts/state-view/header/stores/header.store.ts';
import { useCurrentMode } from '@/hooks/use-mode';
import { AppMode } from '@/types/mode';

import { CenterMenu } from './center-menu';
import { LeftMenu } from './left-menu';
import { RightMenu } from './right-menu';

export const Header = () => {
  const [_isMaximized, setIsMaximized] = useState(false);
  const [appWindow, setAppWindow] = useState<WebviewWindow | null>(null);
  const { isOpen, setOpen } = useHeaderStore();
  const headerRef = useRef<HTMLDivElement>(null);

  const currentMode = useCurrentMode();

  // État pour gérer le thème sombre - vous pouvez l'adapter selon votre logique
  const [isDark, setIsDark] = useState(false);

  // Ou si vous avez un hook/store pour le thème, utilisez-le :
  // const { isDark } = useTheme(); // exemple

  // Ou détection automatique du thème système :
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getModeClasses = (mode: AppMode, isDark: boolean = false): string => {
    const darkClass = isDark ? ' dark' : '';
    switch (mode) {
      case 'Scada':
        return `scada${darkClass}`;
      case 'GameMaster':
        return `gamemaster${darkClass}`;
      default:
        return darkClass.trim(); // mode par défaut
    }
  };

  useEffect(() => {
    const initWindow = async () => {
      const window = getCurrentWindow() as WebviewWindow;
      setAppWindow(window);
      try {
        const maximized = await window.isMaximized();
        setIsMaximized(maximized);
      } catch (_error) {
        // Handle error silently
      }
    };
    initWindow();
  }, []);

  // Gestion du clic à l'extérieur - modifiée pour exclure les menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Ne pas fermer si on clique sur un élément de menu
      const isMenuClick =
        target.closest('[role="menubar"]') ||
        target.closest('[role="menu"]') ||
        target.closest('[role="menuitem"]') ||
        target.closest('[data-radix-collection-item]');

      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node) &&
        !isMenuClick
      ) {
        setOpen(false);
      }
    };

    // Ajouter l'event listener seulement si le menu est ouvert
    if (isOpen) {
      // Petit délai pour éviter que le clic d'ouverture ferme immédiatement le menu
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, setOpen]);

  const handleMaximize = async () => {
    if (appWindow) {
      try {
        await appWindow.toggleMaximize();
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (_error) {
        // Handle error silently
      }
    }
  };

  const handleDragStart = async (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click comes from an interactive element
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('select') ||
      target.closest('input') ||
      target.closest('[data-no-drag]') ||
      target.closest('[role="menubar"]') ||
      target.closest('[role="menu"]');

    if (isInteractiveElement) {
      return;
    }

    if (appWindow && e.buttons === 1) {
      try {
        if (e.detail === 2) {
          await handleMaximize();
        } else {
          await appWindow.startDragging();
        }
      } catch (_error) {
        // Handle error silently
      }
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (isOpen) {
    return <SettingsMenu headerRef={headerRef} />;
  }

  return (
    <div className={getModeClasses(currentMode, isDark)}>
      <div
        ref={headerRef}
        className="w-full h-8 flex items-center header-glass z-10"
        onMouseDown={handleDragStart}
      >
        <div
          className="relative flex-1 flex justify-start"
          onMouseDown={stopPropagation}
        >
          <LeftMenu />
        </div>
        <div className="relative hover:bg-foreground/10 cursor-grab flex flex-1 m-2">
          &nbsp;
        </div>
        <div
          className="relative flex flex justify-center"
          onMouseDown={stopPropagation}
        >
          <CenterMenu />
        </div>
        <div className="relative hover:bg-foreground/10 cursor-grab flex flex-1 m-2">
          &nbsp;
        </div>
        <div
          className="relative flex-1 flex justify-end"
          onMouseDown={stopPropagation}
        >
          <RightMenu />
        </div>
      </div>
    </div>
  );
};
