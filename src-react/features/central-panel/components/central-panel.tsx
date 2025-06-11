import {
  DockviewDidDropEvent,
  DockviewReact,
  DockviewReadyEvent,
  DockviewTheme,
  positionToDirection,
} from 'dockview';
import React from 'react';

import 'dockview/dist/styles/dockview.css';
import '../styles/central-panel.css';
import '../styles/dockview-theme.css';

import { ComponentLayouts } from '@/config/central-panel';
import { useCentralPanelStore } from '@/stores/central-panel.store';

import { DraggedItem } from '../types/dragged-item.type';
import { isDraggedItem } from '../utils';

import { LeftHeaderActions } from './left-header-actions';
import { RightHeaderActions } from './right-header-actions';
import { TabComponent } from './tab-component';
import { Watermark } from './watermark';

const customTailwindTheme: DockviewTheme = {
  name: 'tailwind-custom',
  className: 'dockview-theme-tailwind-custom',
  gap: 0,
  dndOverlayMounting: 'absolute',
  dndPanelOverlay: 'group',
};

export const CentralPanel = () => {
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

    let parsedData: DraggedItem;
    try {
      parsedData = JSON.parse(dragData);
    } catch (error) {
      console.error('Error parsing drag data:', error);
      return;
    }

    if (!isDraggedItem(parsedData)) {
      console.warn('Invalid drag data structure:', parsedData);
      return;
    }

    const title = parsedData.name;
    const panel = {
      id: title,
      component: 'sld',
      tabComponent: 'default',
      params: { title },
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
        components={ComponentLayouts}
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
