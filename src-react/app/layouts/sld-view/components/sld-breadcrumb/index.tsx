import React from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Progress } from '@/components/ui/progress';

import { useBreadcrumb } from './use-breadcrumb.ts';
import { useCentralPanelStore } from '@/stores/central-panel.store.ts';

interface SldBreadcrumbProps {
  id: string;
}

export const SldBreadcrumb: React.FC<SldBreadcrumbProps> = ({ id }) => {
  const { addPanel } = useCentralPanelStore();
  const { data: breadcrumb, isLoading: isLoadingBreadcrumb } =
    useBreadcrumb(id);

  const handleBreadcrumbItemClick = (item: { type: string; id: string }) => {
    if (item.type === 'substation' || item.type === 'voltage_level') {
      const id = item.id;
      addPanel({
        id,
        tabComponent: 'default',
        component: 'sld',
        params: { id },
      });
    }
  };

  const renderBreadcrumbContent = () => {
    if (isLoadingBreadcrumb) {
      return (
        <BreadcrumbItem>
          <div className="w-32">
            <Progress value={undefined} className="h-2" />
          </div>
        </BreadcrumbItem>
      );
    }

    if (!breadcrumb || breadcrumb.items.length === 0) {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage>{id}</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    return breadcrumb.items.map((item, index) => (
      <React.Fragment key={`${item.type}-${item.id}`}>
        <BreadcrumbItem>
          {index === breadcrumb.items.length - 1 ? (
            <BreadcrumbPage>{item.name}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              onClick={() => handleBreadcrumbItemClick(item)}
              className="cursor-pointer hover:text-primary"
            >
              {item.name}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {index < breadcrumb.items.length - 1 && <BreadcrumbSeparator />}
      </React.Fragment>
    ));
  };

  return (
    <Breadcrumb className="mx-2 text-xs">
      <BreadcrumbList>{renderBreadcrumbContent()}</BreadcrumbList>
    </Breadcrumb>
  );
};
