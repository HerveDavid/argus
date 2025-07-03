export const formatVoltage = (voltage: number) => {
  return `${voltage}kV`;
};

export const getVoltageLevelColor = (_voltage: number) => {
  return 'text-primary';
};

export const getTopologyIcon = (topology: string) => {
  switch (topology) {
    case 'NODE_BREAKER':
      return '🔗';
    case 'BUS_BREAKER':
      return '🔌';
    default:
      return '⚡';
  }
};
