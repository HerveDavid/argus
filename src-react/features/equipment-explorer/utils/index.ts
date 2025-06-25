export const formatVoltage = (voltage: number) => {
  if (voltage >= 1000000) {
    return `${(voltage / 1000000).toFixed(0)}MV`;
  } else if (voltage >= 1000) {
    return `${(voltage / 1000).toFixed(0)}kV`;
  }
  return `${voltage}V`;
};

export const getVoltageLevelColor = (voltage: number) => {
  if (voltage >= 400000) return 'text-destructive';
  if (voltage >= 200000) return 'text-warning';
  if (voltage >= 100000) return 'text-info';
  if (voltage >= 50000) return 'text-success';
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
