import muuid from "uuid-mongodb";
import rfdc from "rfdc";

import {
  IBase,
  IBaseFindManyOptions,
  IBaseInternalFindManyOptions,
  IBaseFindOneOptions,
  IBaseInternalFindOneOptions,
  IBaseFilters,
  IBaseInternalFilters,
} from "../types";

const clone = rfdc();

// TODO: refactor these into 1 or 2, somehow...
const mapInternalFilters = <T extends IBase>(filters: IBaseFilters<T>): IBaseInternalFilters<T> => {
  const clonedFilters = clone(filters);

  const mappedFilters = {
    ...clonedFilters,
    ...(clonedFilters.uuid == null ? {} : { _id: muuid.from(clonedFilters.uuid) }),
  };

  Reflect.deleteProperty(mappedFilters, "uuid");

  return mappedFilters;
};

const mapInternalFindOneOptions = <T extends IBase>(options: IBaseFindOneOptions<T>): IBaseInternalFindOneOptions<T> => {
  const clonedOptions = clone(options);

  const mappedOptions = {
    ...clonedOptions,
    where: {
      ...clonedOptions.filters,
      ...(clonedOptions.filters?.uuid == null ? {} : { _id: muuid.from(clonedOptions.filters.uuid) }),
    },
  };

  Reflect.deleteProperty(mappedOptions, "filters");
  Reflect.deleteProperty(mappedOptions.where, "uuid");

  return mappedOptions;
};

const mapInternalFindManyOptions = <T extends IBase>(options: IBaseFindManyOptions<T>): IBaseInternalFindManyOptions<T> => {
  const clonedOptions = clone(options);

  const mappedOptions = {
    ...clonedOptions,
    where: {
      ...clonedOptions.filters,
      ...(clonedOptions.filters?.uuid == null ? {} : { _id: muuid.from(clonedOptions.filters.uuid) }),
    },
  };

  Reflect.deleteProperty(mappedOptions, "filters");
  Reflect.deleteProperty(mappedOptions.where, "uuid");

  return mappedOptions;
};

export {
  mapInternalFilters,
  mapInternalFindOneOptions,
  mapInternalFindManyOptions,
};
