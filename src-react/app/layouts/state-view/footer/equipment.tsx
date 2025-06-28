import { useSelectedItemStore } from '@/stores/window-header.store';

export const Equipement = () => {
  const { title } = useSelectedItemStore();

  return (
    <div>
      <span className="text-xs text-muted-foreground">{title}</span>
    </div>
  );
};
