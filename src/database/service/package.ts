import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import PackageModel from "../model/package";
import { IPackage, IBaseInsert, IPackageQueryOptions } from "../types";

// TODO: move this into a helpers file or something
// imo its important to call this here rather than in the routes, cant trust anyone using
// the PackageService api to know that regex needs to be escaped
// mdn: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
const escapeRegex = (str: string): string => str.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

class PackageService extends BaseService<PackageModel> {
  repository = getMongoRepository(PackageModel);

  // index stuff
  public async setupIndices(): Promise<void> {
    await this.repository.createCollectionIndexes([
      {
        key: {
          Id: 1,
        },
        unique: true,
      },
      {
        key: {
          Name: "text",
          Publisher: "text",
          Description: "text",
        },
        // will probably always match the name first
        weights: {
          Name: 11,
          Publisher: 5,
          // for clarity
          Description: 1,
        },
      },
    ]);
  }

  // create a package if it doesnt already exist (matched id), otherwise update the existing one
  public async upsertPackage(pkg: IBaseInsert<IPackage>): Promise<void> {
    const { Id: id } = pkg;

    // shitty validation (until i do better validation) for something that can
    // potentially seriously fuck shit up
    if (id == null) {
      throw new Error("id not set");
    }

    await this.repository.updateOne(
      {
        Id: id,
      },
      {
        $set: pkg,
      },
      {
        upsert: true,
      },
    );
  }

  public async searchPackages(queryOptions: IPackageQueryOptions, take: number, skip: number): Promise<IPackage[]> {
    const optionCount = Object.values(queryOptions).filter(e => e != null).length;
    if (optionCount === 0) {
      return [];
    }

    // only use query if its the only field set (would not make sense if more specific fields are set)
    const { query } = queryOptions;

    if (query != null && optionCount === 1) {
      const results = await Promise.all([
        this.repository.find({
          "Latest.Name": new RegExp(`.*${escapeRegex(query)}.*`, "i"),
        } as unknown as undefined),
        this.repository.find({
          "Latest.Publisher": new RegExp(`.*${escapeRegex(query)}.*`, "i"),
        } as unknown as undefined),
        this.repository.find({
          "Latest.Description": new RegExp(`.*${escapeRegex(query)}.*`, "i"),
        } as unknown as undefined),
      ]);

      const pkgs = results.flat().filter((e, i, a) => a.findIndex(f => e.Id === f.Id) === i); // .slice(3);

      return pkgs;
    }

    const {
      name,
      publisher,
      description,
      tags,
    } = queryOptions;

    const pkgs = await this.repository.find({
      ...(name == null ? {} : {
        "Latest.Name": new RegExp(`.*${escapeRegex(name)}.*`, "i"),
      }),
      ...(publisher == null ? {} : {
        "Latest.Publisher": new RegExp(`.*${escapeRegex(publisher)}.*`, "i"),
      }),
      ...(description == null ? {} : {
        "Latest.Description": new RegExp(`.*${escapeRegex(description)}.*`, "i"),
      }),
      ...(tags == null || tags.length === 0 ? {} : {
        "Latest.Tags": {
          $all: tags.map(e => e.trim().toLowerCase()),
        },
      }),
      take,
      skip,
    } as unknown as undefined);

    return pkgs;
  }

  // NOTE: shitty typeorm types
  public async findByPublisher(publisher: string, take: number, skip: number): Promise<IPackage[]> {
    const pkgs = await this.repository.find({
      "Latest.Publisher": new RegExp(`.*${escapeRegex(publisher)}.*`),
      take,
      skip,
    } as unknown as undefined);

    return pkgs;
  }

  public async findSinglePackage(publisher: string, packageName: string): Promise<IPackage | undefined> {
    const pkg = await this.repository.findOne({
      Id: `${publisher}.${packageName}`,
    });

    return pkg;
  }
}

export default PackageService;
