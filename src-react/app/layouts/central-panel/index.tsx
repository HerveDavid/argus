import { IDockviewPanelProps } from 'dockview';

import { Substation } from '@/types/substation';

import { SldView } from '../../layouts/sld-view';

export const CentralPanelLayouts: Record<
  string,
  React.FunctionComponent<IDockviewPanelProps>
> = {
  default: ({ params: { title } }: IDockviewPanelProps<{ title: string }>) => {
    return <>Default {title}</>;
  },
  sld: (props: IDockviewPanelProps<{ substation: Substation }>) => {
    return <SldView {...props} />;
  },
};
