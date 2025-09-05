import { IDockviewPanelProps } from 'dockview';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { useCentralPanelStore } from '@/stores/central-panel.store';
import { DslFile } from '@/types/dsl';

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
    <div className="mx-2 flex h-[calc(100%+1px)] items-center justify-between">
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

const Editor = (props: IDockviewPanelProps<{ file: DslFile }>) => {
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
    <div className="mx-2 flex h-[calc(100%+1px)] items-center justify-between">
      <ContextMenu>
        <ContextMenuTrigger>{props.params.file.filename}</ContextMenuTrigger>
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
  editor: Editor,
};
