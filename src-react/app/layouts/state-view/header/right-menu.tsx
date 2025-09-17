import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DslCommands } from '@/features/dsl-editor/components/dsl-commands';
import { useMode } from '@/hooks/use-mode';

export const RightMenu = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [appWindow, setAppWindow] = useState<WebviewWindow | null>(null);
  const { currentMode } = useMode();

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

  const handleMinimize = async () => {
    if (appWindow) {
      try {
        await appWindow.minimize();
      } catch (_error) {
        // Handle error silently
      }
    }
  };

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

  const handleClose = async () => {
    if (appWindow) {
      try {
        await appWindow.close();
      } catch (_error) {
        // Handle error silently
      }
    }
  };

  return (
    <div className="mr-2 flex items-center gap-x-4">
      {currentMode === 'GameMaster' && <DslCommands />}

      <div className="bg-border h-6 w-px"></div>

      <div className="flex items-center gap-x-4">
        <Button
          variant="ghost"
          size="sm"
          className="size-5 rounded-full p-2"
          onClick={handleMinimize}
          title="Minimize"
        >
          <Minus className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-5 rounded-full p-2"
          onClick={handleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <Square className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-5 rounded-full p-2"
          onClick={handleClose}
          title="Close"
        >
          <X className="size-3" />
        </Button>
      </div>
    </div>
  );
};
