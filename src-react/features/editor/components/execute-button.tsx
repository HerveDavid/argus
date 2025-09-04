import React from 'react';

// Composant React pour le bouton d'exécution
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
  const truncatedContent =
    lineContent.length > 50
      ? lineContent.substring(0, 50) + '...'
      : lineContent;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onExecute) {
      onExecute(lineNumber, lineContent);
    } else {
      console.log(`Executing line ${lineNumber}: "${lineContent}"`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="execute-btn"
      title={`Execute: ${truncatedContent}`}
      style={{
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '3px',
        padding: '2px 6px',
        fontSize: '10px',
        cursor: 'pointer',
        marginLeft: '4px',
      }}
    >
      ▶
    </button>
  );
};
