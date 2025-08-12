import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MenuIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useHeaderStore } from '@/app/layouts/state-view/header/stores/header.store.ts';
import { Menubar, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import { ProjectWidget } from '@/features/projects';
import { SessionWidget } from '@/features/sessions';

export const LeftMenu = () => {
  const [_, setAppWindow] = useState<WebviewWindow | null>(null);
  const { setOpen } = useHeaderStore();

  useEffect(() => {
    const initWindow = async () => {
      const window = getCurrentWindow() as WebviewWindow;
      setAppWindow(window);
    };
    initWindow();
  }, []);

  const handleToggleMenu = () => {
    setOpen(true);
  };

  return (
    <div className="flex">
      <Menubar className="bg-transparent border-0 shadow-none text-xs p-0">
        <MenubarMenu>
          <MenubarTrigger
            className="bg-transparent"
            title="Menu"
            onClick={handleToggleMenu}
          >
            <MenuIcon className="size-4" />
          </MenubarTrigger>
        </MenubarMenu>

        <ProjectWidget />
        <SessionWidget />
      </Menubar>
    </div>
  );
};
