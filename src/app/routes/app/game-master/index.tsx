import { useParams } from 'react-router';

const GameMaster = () => {
  const { projectId } = useParams();

  return <>Game Master {projectId}</>;
};

export default GameMaster;
