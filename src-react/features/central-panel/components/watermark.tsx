import { IWatermarkPanelProps } from 'dockview';

export const Watermark = (_props: IWatermarkPanelProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <h1 className="text-xl font-medium text-center">
        Drag and drop equipment on this panel
      </h1>
      <p className="text-sm opacity-70 mt-2 text-center">
        Get started by adding your equipment here
      </p>
    </div>
  );
};
