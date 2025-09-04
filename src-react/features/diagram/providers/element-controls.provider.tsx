import React, { createContext } from 'react';

type ElementControlsType = {};

const ElementControlsContext = createContext<ElementControlsType | undefined>(
  undefined,
);

export const ElementControlsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Hooks

  // Context
  const store = React.useMemo(() => ({}), []);

  return (
    <ElementControlsContext.Provider value={store}>
      {children}
    </ElementControlsContext.Provider>
  );
};
