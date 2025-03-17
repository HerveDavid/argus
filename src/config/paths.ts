export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },
  scada: {
    path: '/scada',
    getHref: () => '/scada',
  },
  settings: {
    path: '/settings',
    getHref: () => '/settings',
  },
  gameMaster: {
    root: {
      path: '/game-master',
      getHref: () => '/game-master',
    },
    home: {
      path: '/game-master/:projectId',
      getHref: (id: string) => `/game-master/${id}`,
    },
    mapping: {
      path: '/game-master/mapping/:projectId',
      getHref: (id: string) => `/game-master/mapping/${id}`,
    },
  },
} as const;
