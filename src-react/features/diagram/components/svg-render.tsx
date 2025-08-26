import { FeedersProvider } from "../providers/feeders.provider";

export const SvgRender = ({ svgRef }: { svgRef: React.RefObject<SVGSVGElement> }) => (
  <FeedersProvider>
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-default"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  </FeedersProvider>
);