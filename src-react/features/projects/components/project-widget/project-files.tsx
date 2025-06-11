export const ProjectFiles = ({ configPath }: { configPath?: string }) => (
  <div className="flex gap-1">
    {configPath && <div className="text-xs text-chart-2">TOML</div>}
  </div>
);
