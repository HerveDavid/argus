import { useDiagramStore } from '../../stores/use-diagram.store';

export interface CommandsProps {
  lineId?: string;
}

export const Commands: React.FC<CommandsProps> = () => {
  const { metadata } = useDiagramStore();

  if (!metadata) {
    return <div>loading</div>;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 bg-secondary overflow-hidden">
        <div className="h-full w-full flex items-center justify-center bg-secondary">
          {metadata.feederInfos.length}
        </div>
      </div>
    </div>
  );
};
