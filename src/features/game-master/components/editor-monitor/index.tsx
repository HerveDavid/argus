import GridView from '@/features/mapping/components/grid-view';
import { TelecomPreview } from './telecom-preview';

export const EditorMonitor = () => {
  return (
    <div className="flex flex-1">
      <GridView></GridView>
      <TelecomPreview></TelecomPreview>
    </div>
  );
};
