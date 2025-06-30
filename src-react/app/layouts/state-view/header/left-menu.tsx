import { MenuIcon } from 'lucide-react';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { ProjectWidget } from '@/features/projects';
import { useEffect, useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';

export const LeftMenu = () => {
  const [appWindow, setAppWindow] = useState<WebviewWindow | null>(null);

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

  return (
    <div className="flex">
      <Menubar className="bg-transparent border-0 shadow-none text-xs p-0">
        <MenubarMenu>
          <MenubarTrigger className="bg-transparent" title="Menu">
            <MenuIcon className="size-4" />
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Open Project <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />

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

        <ProjectWidget />
      </Menubar>
    </div>
  );
};
