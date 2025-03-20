import React, { useState } from 'react';
import EditorLayout from '@/components/layouts/editor';
import { useSubstations } from '@/features/network/hooks/use-substations';
import { useSubstationDetails } from '@/features/network/hooks/use-substation-details';
import { NetworkExplorer } from '@/features/network/components/network-explorer';
import { SubstationViewer } from '@/features/network/components/network-explorer/substation-viewer';

const HomeRoute: React.FC = () => {
  const [selectedSubstationId, setSelectedSubstationId] = useState<string>();

  const substationsData = useSubstations();
  const substationDetails = useSubstationDetails(selectedSubstationId);

  const handleSubstationSelect = (id: string) => {
    setSelectedSubstationId(id);
  };

  return (
    <EditorLayout>
      <div className="flex w-full h-full bg-gray-50">
        <NetworkExplorer
          substationsData={substationsData}
          selectedSubstationId={selectedSubstationId}
          onSubstationSelect={handleSubstationSelect}
        />
        <SubstationViewer
          substationId={selectedSubstationId}
          substationDetails={substationDetails}
        />
      </div>
    </EditorLayout>
  );
};

export default HomeRoute;
