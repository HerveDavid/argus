import { useWindowHeaderStore } from '@/stores/window-header.store';

export const CenterMenu = () => {
  const { title } = useWindowHeaderStore();

  return (
    <div className="text-sm text-foreground ">
      <h2>{title}</h2>
    </div>
  );
};
