import { useParams } from 'react-router';
import { CentralPanelLayouts } from '@/app/layouts/central-panel';
import { StateView } from '@/app/layouts/state-view';
import { CentralPanel } from '@/features/central-panel';

const Panels = () => {
  const { _id } = useParams();
  return (
    <StateView>
      <CentralPanel layouts={CentralPanelLayouts} />
    </StateView>
  );
};

export default Panels;
