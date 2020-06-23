import { Constructor } from "./constructor";

enum FieldType {
  Number = "number",
  String = "string",
  Boolean = "boolean",
  Null = "null",
  Object = "object",
  Array = "array",
}

type Validation =
  | {
    type: FieldType.Number;
    bounds?: {
      min: number;
      max: number;
    };
  }
  | {
    type: FieldType.String;
    bounds?: {
      minLen: number;
      maxLen: number;
      regex: RegExp;
    };
  }
  | {
    type: FieldType.Boolean;
  }
  | {
    type: FieldType.Null;
  }
  | {
    type: FieldType.Object;
  }
  | {
    type: FieldType.Array;
    bounds?: {
      elementType: FieldType | Constructor;
    };
  }
  | {
    type: Constructor;
  };

export {
  FieldType,
  Validation,
};
