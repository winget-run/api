import { MongoRepository } from "typeorm";
import muuid from "uuid-mongodb";

import BaseModel from "../model/base";
import { mapInternalFindManyOptions, mapInternalFindOneOptions, mapInternalFilters } from "../helpers";
import {
  IBaseFindManyOptions,
  IBaseFindOneOptions,
  IBaseUpdateOptions,
  IBaseUpdate,
  IBaseFilters,
  IUpdateResult,
  IDeleteResult,
  IBaseInsert,
  IInsertResult,
} from "../types";

// TODO: handle errors properly
// TODO: figure out a way to return uuid instead of _id (mongoose equivalent of toObject or whatever)
abstract class BaseService<T extends BaseModel> {
  protected repository!: MongoRepository<T>

  public async find(options: IBaseFindManyOptions<T>): Promise<T[]> {
    try {
      const internalOptions = mapInternalFindManyOptions(options);

      return this.repository.find(internalOptions);
    } catch (error) {
      throw new Error(error);
    }
  }

  public async count(options: IBaseFindManyOptions<T>): Promise<number> {
    try {
      const internalOptions = mapInternalFindManyOptions(options);

      return this.repository.count(internalOptions);
    } catch (error) {
      throw new Error(error);
    }
  }

  public async findAndCount(options: IBaseFindManyOptions<T>): Promise<[T[], number]> {
    try {
      const internalOptions = mapInternalFindManyOptions(options);

      return this.repository.findAndCount(internalOptions);
    } catch (error) {
      throw new Error(error);
    }
  }

  public async findOne(options: IBaseFindOneOptions<T>): Promise<T | undefined> {
    try {
      const internalOptions = mapInternalFindOneOptions(options);

      return this.repository.findOne(internalOptions);
    } catch (error) {
      throw new Error(error);
    }
  }

  public async findOneById(uuid: string): Promise<T | undefined> {
    try {
      const internalOptions = mapInternalFindOneOptions({ filters: { uuid } });

      return this.repository.findOne(internalOptions);
    } catch (error) {
      throw new Error(error);
    }
  }

  public async insertOne(insert: IBaseInsert<T>): Promise<IInsertResult> {
    try {
      return this.repository.insertOne({
        ...insert,

        _id: muuid.v4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  public async update(options: IBaseUpdateOptions<T>): Promise<IUpdateResult> {
    try {
      const internalFilters = mapInternalFilters(options.filters ?? {});

      return this.repository.updateMany(internalFilters, {
        $set: {
          ...options.update,

          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  public async updateOne(options: IBaseUpdateOptions<T>): Promise<IUpdateResult> {
    try {
      const internalFilters = mapInternalFilters(options.filters ?? {});

      return this.repository.updateOne(internalFilters, {
        $set: {
          ...options.update,

          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  public async updateOneById(uuid: string, update: IBaseUpdate<T>): Promise<IUpdateResult> {
    try {
      const internalFilters = mapInternalFilters({ uuid });

      return this.repository.updateOne(internalFilters, {
        $set: {
          ...update,

          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  public async delete(filters: IBaseFilters<T>): Promise<IDeleteResult> {
    try {
      const internalFilters = mapInternalFilters(filters);

      return this.repository.deleteMany(internalFilters);
    } catch (error) {
      throw new Error(error);
    }
  }

  public async deleteOne(filters: IBaseFilters<T>): Promise<IDeleteResult> {
    try {
      const internalFilters = mapInternalFilters(filters);

      return this.repository.deleteOne(internalFilters);
    } catch (error) {
      throw new Error(error);
    }
  }

  public async deleteOneById(uuid: string): Promise<IDeleteResult> {
    try {
      const internalFilters = mapInternalFilters({ uuid });

      return this.repository.deleteOne(internalFilters);
    } catch (error) {
      throw new Error(error);
    }
  }
}

export default BaseService;
