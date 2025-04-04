export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },
  settings: {
    path: '/settings',
    getHref: () => '/settings',
  },
  views: {
    stateView: {
      path: '/views/state-view/:substationId',
      getHref: (id: string) => {
        return `/views/state-view/${id}`;
      },
    },
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
