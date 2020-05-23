// TODO: readonly shite here and in other interfaces (where applicable)
// TODO: remove select for shit like _id and __v, etc
interface IBase {
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
