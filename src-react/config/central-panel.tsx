import { IDockviewPanelProps } from 'dockview';

import { SldView } from '@/app/layouts/sld-view';
import { Substation } from '@/types/substation';

export const ComponentLayouts: Record<
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
