import { IDockviewPanelProps } from 'dockview';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { useCentralPanelStore } from '@/stores/central-panel.store';
import { useWindowHeaderStore } from '@/stores/window-header.store';

const Default = (props: IDockviewPanelProps<{ title: string }>) => {
  const { setTitle } = useWindowHeaderStore();
  const { removePanel, removeGroup } = useCentralPanelStore();

  const handleClose = () => {
    removePanel(props.api.id);
  };

  const handleTabClick = () => {
    setTitle(props.params.title);
  };

  const handleCloseOthers = () => {
    const group = props.api.group;
    const panelIds = group.panels
      .map((panel) => panel.id)
      .filter((id) => id !== props.params.title);
    panelIds.forEach(removePanel);
  };

  const handleCloseAll = () => {
    const group = props.api.group;
    removeGroup(group);
  };

  return (
    <div
      className="flex justify-between items-center mx-2 h-[calc(100%+1px)]"
      onMouseDown={handleTabClick}
    >
      <ContextMenu>
        <ContextMenuTrigger>{props.api.title}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleClose}>Close</ContextMenuItem>
          <ContextMenuItem onClick={handleCloseOthers}>
            Close Others
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCloseAll}>Close All</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Add in Favorites</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Detach Panel</ContextMenuItem>
          <ContextMenuItem>Detach Groups</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export const TabComponent = {
  default: Default,
};
