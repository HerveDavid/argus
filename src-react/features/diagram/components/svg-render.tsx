import { useEquipmentControls } from '../hooks/use-equipment-controls';
import { FeedersProvider } from '../providers/feeders.provider';
import { ElementControls } from './element-controls';

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
          <ElementControls targetElement={targetElement}>
            <svg
              ref={svgRef}
              className="w-full h-full cursor-default"
              style={{ minHeight: '400px' }}
              onContextMenu={handleContextMenuTrigger}
            />
          </ElementControls>
        </div>
      </div>
    </FeedersProvider>
  );
};
