import { EditorLayout } from '@/components/layouts/editor';
import Editor from '@/features/game-master/components/editor';
import Mapping from '@/features/mapping/components';

const GameMaster = () => {
  return (
    <EditorLayout>
      {/* <Editor /> */}
      <Mapping></Mapping>
    </EditorLayout>
  );
};

export default GameMaster;
