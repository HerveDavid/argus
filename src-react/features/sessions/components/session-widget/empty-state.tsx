import { MenubarItem } from '@/components/ui/menubar';

export const EmptyState = () => (
  <MenubarItem disabled className="text-center text-muted-foreground">
    No session open
  </MenubarItem>
);
