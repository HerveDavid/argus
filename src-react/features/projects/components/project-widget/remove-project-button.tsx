import { X } from 'lucide-react';
import React from 'react';

export const RemoveProjectButton = ({
  onClick,
  className = 'opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500',
}: {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) => (
  <button onClick={onClick} className={className} title="Remove from list">
    <X className="size-3" />
  </button>
);
