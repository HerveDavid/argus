import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MenuIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useHeaderStore } from '@/app/layouts/state-view/header/stores/header.store.ts';
import { Menubar, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
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
    <div className="flex items-center gap-x-4">
      <Menubar className="border-0 bg-transparent p-0 text-xs shadow-none">
        <MenubarMenu>
          <MenubarTrigger
            className="bg-transparent"
            title="Menu"
            onClick={handleToggleMenu}
          >
            <MenuIcon className="size-4" />
          </MenubarTrigger>
        </MenubarMenu>

        <SessionWidget />
      </Menubar>
    </div>
  );
};
