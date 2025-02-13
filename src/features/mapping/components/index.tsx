import GridView from './grid-view';
import TelecomView from './network-view';

const Mapping = () => {
  return (
    <>
      <div className="flex">
        <GridView></GridView>
        <TelecomView></TelecomView>
      </div>
      <div>Control</div>
    </>
  );
};

export default Mapping;
