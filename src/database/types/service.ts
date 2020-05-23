import { FindManyOptions, FindOneOptions } from "typeorm";

import { IBase } from "./base";

enum SortOrder {
  ASCENDING = 1,
  DESCENDING = -1,
}

// type IBaseFilters<T extends IBase> = Partial<Omit<T, "_id" | "__v">>;
// type IBaseInternalFilters<T extends IBase> = Partial<Omit<T, "uuid" | "__v">>;

// string | anythingElse
// string | regex | anythingElse

// NOTE: this is as close to sane as i could get it
type IBaseFilters<T extends IBase> = {
  [P in keyof Omit<T, "_id" | "__v">]?: NonNullable<T[P]> extends string ? T[P] | RegExp : T[P];
} & { uuid?: string };

type IBaseInternalFilters<T extends IBase> = {
  [P in keyof Omit<T, "uuid" | "__v">]?: NonNullable<T[P]> extends string ? T[P] | RegExp : T[P];
};

type IBaseSelect<T extends IBase> = (keyof T)[];
type IBaseOrder<T extends IBaseFilters<IBase>> = {
  [P in keyof T]?: SortOrder;
};

interface IBaseFindOneOptions<T extends IBase> {
  filters: IBaseFilters<T>;
  select?: IBaseSelect<T>;
  order?: IBaseOrder<T>;
}

type IBaseFindManyOptions<T extends IBase> = IBaseFindOneOptions<T> & {
  take?: number;
  skip?: number;
}

type IBaseInternalFindOneOptions<T extends IBase> = FindOneOptions<T>;
type IBaseInternalFindManyOptions<T extends IBase> = FindManyOptions<T>;

type IBaseInsert<T extends IBase> = Omit<T, "_id" | "uuid" | "__v" | "createdAt" | "updatedAt">;

interface IInsertResult {
  insertedCount: number;
}

type IBaseUpdate<T extends IBase> = Partial<Omit<T, "_id" | "uuid" | "__v" | "createdAt" | "updatedAt">>;

interface IBaseUpdateOptions<T extends IBase> {
  filters: IBaseFilters<T>;
  update: IBaseUpdate<T>;
}

interface IUpdateResult {
  matchedCount: number;
  modifiedCount: number;
}

interface IDeleteResult {
  deletedCount?: number;
}

export {
  SortOrder,
  IBaseFilters,
  IBaseInternalFilters,
  IBaseSelect,
  IBaseOrder,
  IBaseFindOneOptions,
  IBaseFindManyOptions,
  IBaseInternalFindOneOptions,
  IBaseInternalFindManyOptions,
  IBaseInsert,
  IInsertResult,
  IBaseUpdate,
  IBaseUpdateOptions,
  IUpdateResult,
  IDeleteResult,
};
