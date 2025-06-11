export const getProjectInitials = (projectName: string): string => {
  if (!projectName) return 'P';
  const cleaned = projectName.replace(/[^a-zA-Z0-9]/g, '');
  return cleaned.slice(0, 3).toUpperCase() || 'P';
};

export const formatProjectDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
