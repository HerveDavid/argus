export const handleApiError = (error: unknown, context: string): Error => {
  console.error(`Error in ${context}:`, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new Error(`${context}: ${errorMessage}`);
};
