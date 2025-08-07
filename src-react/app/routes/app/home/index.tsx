import { CentralPanelLayouts } from '@/app/layouts/central-panel';
import { StateView } from '@/app/layouts/state-view';
import { CentralPanel } from '@/features/central-panel';

const App = () => {
  return (
    <StateView>
      <CentralPanel layouts={CentralPanelLayouts} />
    </StateView>
  );
};

export default App;
