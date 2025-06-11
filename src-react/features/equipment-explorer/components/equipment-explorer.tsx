import DraggableItem from './draggable-item';

interface FileItem {
  name: string;
}

const fileStructure: FileItem[] = [
  { name: 'substation1' },
  { name: 'substation2' },
  { name: 'substation3' },
  { name: 'substation4' },
  { name: 'substation5' },
  { name: 'substation6' },
  { name: 'substation7' },
  { name: 'substation8' },
  { name: 'substation9' },
  { name: 'substation10' },
];

export const EquipmentExplorer = () => {
  return (
    <div className="h-full text-card-foreground">
      <div className="flex flex-col ">
        {fileStructure.map((item, index) => (
          <DraggableItem key={`${item.name}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
};
