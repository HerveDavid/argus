import { IDockviewPanelProps } from 'dockview';

import { SldView } from '../sld-view';
import { DslEditor } from '@/features/dsl-editor';
import { DslFile } from '@/types/dsl';

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
  editor: (props: IDockviewPanelProps<{ file: DslFile }>) => {
    return <DslEditor {...props} />;
  },
};
