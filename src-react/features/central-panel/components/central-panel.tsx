import {
  DockviewDidDropEvent,
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  positionToDirection,
} from 'dockview';
import React from 'react';

import 'dockview/dist/styles/dockview.css';
import '../styles/central-panel.css';
import '../styles/dockview-theme.css';

import { useCentralPanelStore } from '@/stores/central-panel.store';

import { customTailwindTheme } from './dockview-theme';
import { LeftHeaderActions } from './left-header-actions';
import { RightHeaderActions } from './right-header-actions';
import { TabComponent } from './tab-component';
import { Watermark } from './watermark';

export interface CentralPanelProps {
  layouts: Record<string, React.FunctionComponent<IDockviewPanelProps>>;
}

export const CentralPanel: React.FC<CentralPanelProps> = ({ layouts }) => {
  const { api, setApi, addPanel } = useCentralPanelStore();

  React.useEffect(() => {
    if (!api) {
      return;
    }
    const disposable = api.onUnhandledDragOverEvent((event) => {
      event.accept();
    });
    return () => {
      disposable.dispose();
    };
  }, [api]);

  const onReady = (event: DockviewReadyEvent) => {
    setApi(event.api);
  };

  const onDidDrop = (event: DockviewDidDropEvent) => {
    const dragData =
      event.nativeEvent?.dataTransfer?.getData('application/json');
    if (!dragData) {
      return;
    }

    let id: string;
    try {
      id = JSON.parse(dragData);
    } catch (error) {
      console.error('Error parsing drag data:', error);
      return;
    }

    // if (!isDraggedItem(id)) {
    //   console.warn('Invalid drag data structure:', id);
    //   return;
    // }

    const panel = {
      id,
      component: 'sld',
      tabComponent: 'default',
      params: { id },
      position: {
        direction: positionToDirection(event.position),
        referenceGroup: event.group,
      },
    };
    addPanel(panel);
  };

  return (
    <div className="h-full flex flex-col">
      <DockviewReact
        watermarkComponent={Watermark}
        components={layouts}
        onReady={onReady}
        tabComponents={TabComponent}
        theme={customTailwindTheme}
        onDidDrop={onDidDrop}
        leftHeaderActionsComponent={LeftHeaderActions}
        rightHeaderActionsComponent={RightHeaderActions}
        dndEdges={{
          size: { value: 100, type: 'pixels' },
          activationSize: { value: 5, type: 'percentage' },
        }}
      />
    </div>
  );
};
