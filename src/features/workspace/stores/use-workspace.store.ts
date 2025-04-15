import { create } from 'zustand';

// ------------------------------
// Types
// ------------------------------$
interface WorkspaceData {
  substations: [string];
}

export interface WorkspaceStore {}
// ------------------------------
// Store
// ------------------------------
export const useWorkspaceStore = create();
