// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = {}> = new (...args: any[]) => T;

export {
  // eslint-disable-next-line import/prefer-default-export
  Constructor,
};
