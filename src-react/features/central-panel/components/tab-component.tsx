import { IDockviewPanelProps } from 'dockview';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { useCentralPanelStore } from '@/stores/central-panel.store';

const Default = (props: IDockviewPanelProps<{ title: string }>) => {
  const { removePanel, removeGroup } = useCentralPanelStore();
  const othersDisabled = props.api.group.panels.length <= 1;

  const handleClose = () => {
    removePanel(props.api.id);
  };

  const handleCloseOthers = () => {
    const group = props.api.group;
    const panelIds = group.panels
      .map((panel) => panel.id)
      .filter((id) => id !== props.api.id);
    panelIds.forEach(removePanel);
  };

  const handleCloseAll = () => {
    const group = props.api.group;
    removeGroup(group);
  };

  return (
    <div
      className="flex justify-between items-center mx-2 h-[calc(100%+1px)]"
    >
      <ContextMenu>
        <ContextMenuTrigger>{props.api.title}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleClose}>Close</ContextMenuItem>
          <ContextMenuItem
            onClick={handleCloseOthers}
            disabled={othersDisabled}
          >
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
