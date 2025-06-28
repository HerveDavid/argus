import { useSelectedItemStore } from '@/stores/window-header.store';

export const Equipement = () => {
  const { title } = useSelectedItemStore();

  return (
    <div>
      <p className="text-xs text-muted-foreground">{title}</p>
    </div>
  );
};
