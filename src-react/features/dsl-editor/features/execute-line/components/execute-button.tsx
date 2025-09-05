import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import React from 'react';

interface ExecuteButtonProps {
  lineNumber: number;
  lineContent: string;
  onExecute?: (lineNumber: number, lineContent: string) => void;
}

export const ExecuteButton: React.FC<ExecuteButtonProps> = ({
  lineNumber,
  lineContent,
  onExecute,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onExecute) {
      onExecute(lineNumber, lineContent);
    } else {
      console.log(`Executing line ${lineNumber}: "${lineContent}"`);
    }
  };

  const truncatedContent =
    lineContent.length > 50
      ? lineContent.substring(0, 50) + '...'
      : lineContent;

  return (
    <div className="mx-2">
      <Button
        className='rounded-sm'
        size="xs"
        onClick={handleClick}
        title={`Execute: ${truncatedContent}`}
      >
        <Play className='size-3'/>
      </Button>
    </div>
  );
};
