import type { Constructor } from "../types";

const collection = () => <T extends Constructor>(Base: T): T => {
  // TODO: check for at least 1 id field

  class Collection extends Base {
    constructor(...args: any[]) {
      super(...args);

      Object.keys(Base.prototype).forEach(propertyKey => {
        const document = args[0] ?? {};
        // default > document > null
        (this as any)[propertyKey] = (this as any)[propertyKey] ?? document[propertyKey] ?? null;

        const required = Reflect.getMetadata("required", this, propertyKey);

        if (required && (this as any)[propertyKey] == null) {
          throw new Error("required @collection prop not set");
        }
      });
    }
  }

  return Collection;
};

export default collection;
