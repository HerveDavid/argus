import React from 'react';
import EditorLayout from '@/components/layouts/editor';
import SimulationEditor from '@/features/game-master/components/example';

const GameMasterView: React.FC = () => {
  return (
    <EditorLayout>
      <SimulationEditor />
    </EditorLayout>
  );
};

export default GameMasterView;
