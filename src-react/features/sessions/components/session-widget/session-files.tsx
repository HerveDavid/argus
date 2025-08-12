export const SessionFiles = ({ path }: { path?: string }) => (
  <div className="flex gap-1">
    {path && <div className="text-xs text-chart-2">TOML</div>}
  </div>
);
