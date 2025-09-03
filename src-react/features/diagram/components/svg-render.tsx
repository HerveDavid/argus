import { useEquipmentControls } from '../hooks/use-equipment-controls';
import { FeedersProvider } from '../providers/feeders.provider';
import { EquipmentControls } from './equipment-controls';

export const SvgRender = ({
  svgRef,
}: {
  svgRef: React.RefObject<SVGSVGElement>;
}) => {
  // Hooks
  const { targetElement, handleContextMenuTrigger } = useEquipmentControls();

  return (
    <FeedersProvider>
      <div className="h-full flex flex-col relative">
        <div className="flex-1 overflow-hidden bg-background border-0 rounded">
          <EquipmentControls targetElement={targetElement}>
            <svg
              ref={svgRef}
              className="w-full h-full cursor-default"
              style={{ minHeight: '400px' }}
              onContextMenu={handleContextMenuTrigger}
            />
          </EquipmentControls>
        </div>
      </div>
    </FeedersProvider>
  );
};
