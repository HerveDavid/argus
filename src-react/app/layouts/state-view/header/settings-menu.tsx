import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';
import React, { useEffect, useState } from 'react';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';

// Import du hook de mode
import {
  useMode,
  useCurrentMode,
  useIsTransitioning,
} from '@/hooks/use-mode';

interface SettingsMenuProps {
  headerRef: React.RefObject<HTMLDivElement>;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ headerRef }) => {
  const [appWindow, setAppWindow] = useState<WebviewWindow | null>(null);

  // Utilisation des hooks de mode
  const { switchToScada, switchToGameMaster } = useMode();
  const currentMode = useCurrentMode();
  const isTransitioning = useIsTransitioning();

  useEffect(() => {
    const initWindow = async () => {
      const window = getCurrentWindow() as WebviewWindow;
      setAppWindow(window);
    };
    initWindow();
  }, []);

  const handleClose = async () => {
    if (appWindow) {
      try {
        await appWindow.close();
      } catch (_error) {
        // Handle error silently
      }
    }
  };

  // Handler pour le changement de mode
  const handleModeChange = (value: string) => {
    if (isTransitioning) {
      return;
    }

    switch (value) {
      case 'game-master':
        if (currentMode !== 'GameMaster') {
          switchToGameMaster();
        }
        break;
      case 'scada':
        if (currentMode !== 'Scada') {
          switchToScada();
        }
        break;
    }
  };

  // Conversion du mode actuel vers la valeur du radio group
  const getCurrentModeValue = () => {
    const value = currentMode === 'GameMaster' ? 'game-master' : 'scada';
    return value;
  };

  // Empêcher la propagation des événements de clic dans le menu Mode
  const handleModeMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={headerRef}
      className="w-full h-8 flex items-center header-glass z-10 shadow-2xs border-b"
    >
      <Menubar className="bg-transparent border-0 shadow-none text-xs p-0">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New Project <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>New Window</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Settings</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleClose}>Exit</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Find</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Search the web</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Find...</MenubarItem>
                <MenubarItem>Find Next</MenubarItem>
                <MenubarItem>Find Previous</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem>Cut</MenubarItem>
            <MenubarItem>Copy</MenubarItem>
            <MenubarItem>Paste</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem>Always Show Bookmarks Bar</MenubarCheckboxItem>
            <MenubarCheckboxItem checked>
              Always Show Full URLs
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem inset>
              Reload <MenubarShortcut>⌘R</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled inset>
              Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem inset>Toggle Fullscreen</MenubarItem>
            <MenubarSeparator />
            <MenubarItem inset>Hide Sidebar</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Mode</MenubarTrigger>
          <MenubarContent onClick={handleModeMenuClick}>
            <MenubarRadioGroup
              value={getCurrentModeValue()}
              onValueChange={handleModeChange}
            >
              <MenubarRadioItem
                value="game-master"
                disabled={isTransitioning}
                onClick={handleModeMenuClick}
              >
                GameMaster
              </MenubarRadioItem>
              <MenubarRadioItem
                value="scada"
                disabled={isTransitioning}
                onClick={handleModeMenuClick}
              >
                SCADA
              </MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
};
