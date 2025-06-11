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

export const LeftMenu = () => {
  return (
    <div className="">
      <MenuDropdown />
    </div>
  );
};

const MenuDropdown = () => {
  return (
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
          <MenubarItem>Exit</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <ProjectWidget />
    </Menubar>
  );
};
