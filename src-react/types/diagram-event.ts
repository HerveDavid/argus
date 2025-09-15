export type DiagramEvent =
  | {
      tag: 'FeederUpdate';
      content: {
        feeders: Array<readonly [string, number]>;
      };
    }
  | {
      tag: 'StatusChange';
      content: {
        status: string;
      };
    };
