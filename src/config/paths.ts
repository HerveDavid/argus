export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },
  app: {
    root: {
      path: '/app',
      getHref: () => '/app',
    },
    gameMaster: {
      path: 'game-master/:projectId',
      getHref: (id: string) => `/app/game-master/${id}`
    }
  },
} as const;
