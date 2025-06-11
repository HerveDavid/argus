import { IDockviewPanelProps } from 'dockview';

import { SldView } from '@/app/layouts/sld-view';

export const ComponentLayouts = {
  default: ({ params: { title } }: IDockviewPanelProps<{ title: string }>) => {
    return <>Default {title}</>;
  },
  sld: (props: IDockviewPanelProps<{ title: string }>) => {
    return <SldView {...props} />;
  },
};
