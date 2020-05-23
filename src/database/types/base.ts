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
