import { Edit } from 'lucide-react';
import React from 'react';

export const EditProjectButton = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    onClick={onClick}
    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded text-accent-foreground"
    title="Edit project"
  >
    <Edit className="size-3" />
  </button>
);
