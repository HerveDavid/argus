import { EllipsisVertical } from 'lucide-react';

import { CardAction, CardTitle } from '@/components/ui/card.tsx';

export const EditorHeader = () => {
  return (
    <header className="flex items-center justify-between" role="banner">
      <CardTitle className="flex items-center ml-4">
        <div className="flex items-center">
          <h1 className="text-sm font-medium truncate">Sequence 1</h1>
          <EllipsisVertical size={16} />
        </div>
      </CardTitle>
      <CardAction />
    </header>
  );
};
