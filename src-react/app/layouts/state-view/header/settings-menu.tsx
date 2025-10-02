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

import { useMode, useModeError } from '@/hooks/use-mode';
import {
  ModeType,
  useLeftSidebarStore,
  useLeftToolsStore,
  useRightSidebarStore,
  useRightToolsStore,
} from '../stores/state-view.store';
import { invoke } from '@tauri-apps/api/core';
import { useHeaderStore } from './stores/header.store';

interface SettingsMenuProps {
  headerRef: React.RefObject<HTMLDivElement>;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ headerRef }) => {
  const [appWindow, setAppWindow] = useState<WebviewWindow | null>(null);

  const {
    switchToScada,
    switchToGameMaster,
    switchToKpi,
    currentMode,
    isTransitioning,
    state,
  } = useMode();

  const { error, hasError, retryModeChange } = useModeError();
  const { setOpen } = useHeaderStore();

  const leftSidebar = useLeftSidebarStore();
  const rightSidebar = useRightSidebarStore();
  const leftTools = useLeftToolsStore();
  const rightTools = useRightToolsStore();

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

  const switchMode = async (mode: ModeType) => {
    const stores = [leftSidebar, rightSidebar, leftTools, rightTools];
    await Promise.all(stores.map((store) => store.loadPanelsForMode(mode)));
    await invoke('switch_mode_ecs', { mode });
  };

  const handleModeChange = async (value: string) => {
    if (isTransitioning) {
      return;
    }

    switch (value) {
      case 'game-master':
        if (currentMode !== 'GameMaster') {
          switchToGameMaster();
          await switchMode('GameMaster');
        }
        break;
      case 'scada':
        if (currentMode !== 'Scada') {
          switchToScada();
          await switchMode('Scada');
        }
        break;
      case 'kpi':
        if (currentMode !== 'Kpi') {
          switchToKpi();
        }
        break;
    }

    // Close the settings menu after mode change
    setOpen(false);
  };

  const getCurrentModeValue = () => {
    switch (currentMode) {
      case 'GameMaster':
        return 'game-master';
      case 'Scada':
        return 'scada';
      case 'Kpi':
        return 'kpi';
      default:
        return 'game-master';
    }
  };

  const getModeStatus = () => {
    if (state.matches('INITIALIZING')) {
      return '(Initializing...)';
    }
    if (isTransitioning) {
      return '(Switching...)';
    }
    if (hasError) {
      return '(Error)';
    }
    return '';
  };

  return (
    <div ref={headerRef} className="z-10 flex h-8 w-full items-center border-b">
      <Menubar className="border-0 bg-transparent p-0 text-xs shadow-none">
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
          <MenubarTrigger>Mode {getModeStatus()}</MenubarTrigger>
          <MenubarContent>
            {hasError && (
              <>
                <MenubarItem className="cursor-default text-red-600">
                  Error: {error?.message}
                </MenubarItem>
                <MenubarItem onClick={retryModeChange}>
                  Retry Mode Change
                </MenubarItem>
                <MenubarSeparator />
              </>
            )}

            <MenubarRadioGroup
              value={getCurrentModeValue()}
              onValueChange={handleModeChange}
            >
              <MenubarRadioItem
                value="game-master"
                disabled={isTransitioning || state.matches('INITIALIZING')}
              >
                GameMaster
                {currentMode === 'GameMaster' &&
                  isTransitioning &&
                  ' (switching...)'}
              </MenubarRadioItem>

              <MenubarRadioItem
                value="scada"
                disabled={isTransitioning || state.matches('INITIALIZING')}
              >
                SCADA
                {currentMode === 'Scada' &&
                  isTransitioning &&
                  ' (switching...)'}
              </MenubarRadioItem>

              <MenubarRadioItem
                value="kpi"
                disabled={isTransitioning || state.matches('INITIALIZING')}
              >
                KPI
                {currentMode === 'Kpi' && isTransitioning && ' (switching...)'}
              </MenubarRadioItem>
            </MenubarRadioGroup>

            {process.env.NODE_ENV === 'development' && (
              <>
                <MenubarSeparator />
                <MenubarItem className="cursor-default text-xs text-gray-500">
                  State: {state.value.toString()}
                </MenubarItem>
                <MenubarItem className="cursor-default text-xs text-gray-500">
                  Last change:{' '}
                  {state.context.lastModeChange.toLocaleTimeString()}
                </MenubarItem>
              </>
            )}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
};
