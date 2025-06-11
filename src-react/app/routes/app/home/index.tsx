import { StateView } from '@/app/layouts/state-view';
import { CentralPanel } from '@/features/central-panel';

const App = () => {
  return (
    <StateView>
      <CentralPanel />
    </StateView>
  );
};

export default App;
