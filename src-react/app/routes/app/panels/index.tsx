import { useParams } from 'react-router';

const Panels = () => {
  const { id } = useParams();

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {id!} NOT IMPLEMENTED YET
    </div>
  );
};

export default Panels;
