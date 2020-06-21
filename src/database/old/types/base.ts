// TODO: readonly shite here and in other interfaces (where applicable)
// TODO: remove select for shit like _id and __v, etc
interface IBase {
  // TODO: make the _id type more specific
  _id: object;
  uuid: string;
  __v: number;

  createdAt: Date;
  updatedAt: Date;
}

export {
  // eslint-disable-next-line import/prefer-default-export
  IBase,
};
