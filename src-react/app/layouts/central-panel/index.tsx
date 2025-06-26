import { IDockviewPanelProps } from 'dockview';

import { SldView } from '../sld-view';

export const CentralPanelLayouts: Record<
  string,
  React.FunctionComponent<IDockviewPanelProps>
> = {
  default: ({ params: { title } }: IDockviewPanelProps<{ title: string }>) => {
    return <>Default {title}</>;
  },
  sld: (props: IDockviewPanelProps<{ id: string }>) => {
    return <SldView {...props} />;
  },
};
