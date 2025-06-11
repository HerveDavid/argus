import { useMemo } from 'react';

import { createRightSidebarSldsStore } from '../../stores/sld-view.store';

export const useRightSidebarStore = (id: string) => {
  const store = useMemo(() => createRightSidebarSldsStore(id), [id]);
  return store();
};
