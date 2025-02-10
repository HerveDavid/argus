import { EditorLayout } from '@/components/layouts/editor';
import Editor from '@/features/game-master/components/editor';
import { TopMenuBar } from '@/features/top-menu-bar';

const GameMaster = () => {
  return (
    <EditorLayout>
      <Editor />
    </EditorLayout>
  );
};

export default GameMaster;
