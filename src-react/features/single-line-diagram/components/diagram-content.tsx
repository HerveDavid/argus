export const DiagramContent: React.FC<{
  svgRef: React.RefObject<SVGSVGElement>;
}> = ({ svgRef }) => (
  <div className="h-full flex flex-col">
    <div className="flex-1 overflow-hidden bg-muted/25 border-0 rounded">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  </div>
);
