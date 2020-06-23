import { FieldOptions } from "../types";

const field = (options: FieldOptions = {}) => (target: any, propertyKey: string): void => {
  // metadata
  Reflect.defineMetadata("required", options.required ?? false, target, propertyKey);

  // validation
  let value = target[propertyKey];

  const getter = (): typeof value => {
    console.log(`Get: ${propertyKey} => ${value}`);
    return value;
  };

  const setter = (newValue: typeof value): void => {
    console.log(`Set: ${propertyKey} => ${newValue}`);
    value = newValue;
  };

  const updated = Reflect.defineProperty(
    target,
    propertyKey,
    {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    },
  );

  if (!updated) {
    throw new Error("unable to update @field property");
  }
};

export default field;
