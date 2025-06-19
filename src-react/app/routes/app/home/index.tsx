import { StateView } from '@/app/layouts/state-view';
import { ComponentLayouts } from '@/config/central-panel';
import { CentralPanel } from '@/features/central-panel';

const App = () => {
  return (
    <StateView>
      <CentralPanel layouts={ComponentLayouts} />
    </StateView>
  );
};

export default App;
