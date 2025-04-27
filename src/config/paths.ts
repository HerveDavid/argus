export type TypeView = 'substation' | 'voltage-level';

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
      path: '/views/state-view/:type/:substationId/',
      getHref: (id: string, type: TypeView) => {
        return `/views/state-view/${type}/${id}`;
      },
    },
  },
} as const;
