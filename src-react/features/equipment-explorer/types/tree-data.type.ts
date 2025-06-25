import { Substation, VoltageLevel } from '@/types/substation';

export type TreeData = {
  id: string;
  name: string;
  type: 'substation';
  substation: Substation;
  children: {
    id: string;
    name: string;
    type: 'voltage_level';
    voltageLevel: VoltageLevel;
  }[];
};
