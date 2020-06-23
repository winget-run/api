import { Validation } from "./validation";

interface FieldOptions {
  // setting this to false adds a null validation
  required?: boolean;
  validation?: Validation | Validation[];
}

export {
  // eslint-disable-next-line import/prefer-default-export
  FieldOptions,
};
