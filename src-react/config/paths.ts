export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },
  panels: {
    path: '/panels/:id',
    getHref: (id: string) => {
      return `/panels/${id}`;
    },
  },
} as const;
