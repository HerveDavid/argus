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
} as const;
