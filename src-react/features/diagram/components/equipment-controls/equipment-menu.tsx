import React from 'react';
import { ElementInfo } from '../../types/element-info.type';

type EquipmentMenuProps = {
  elementInfo: ElementInfo;
};

export const EquipmentMenu: React.FC<EquipmentMenuProps> = ({
  elementInfo,
}) => {
  return (
    <div className="">
      <div className="px-2 py-2 border-b">{elementInfo.id}</div>
      <div className="px-2 py-2 border-b">
        {elementInfo.nodeInfo?.componentType}
      </div>
    </div>
  );
};
