import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import PackageModel from "../model/package";
import { generateNGrams } from "../helpers/package";
import {
  IPackage,
  IBaseInsert,
  IPackageQueryOptions,
  SortOrder,
  PackageSortFields,
} from "../types";

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
          "NGrams.Name": "text",
          "NGrams.Publisher": "text",
          "NGrams.Tags": "text",
          "NGrams.Description": "text",
        },
        // will probably always match the name first
        weights: {
          "NGrams.Name": 15,
          "NGrams.Publisher": 7,
          "NGrams.Tags": 3,
          // for clarity (default)
          "NGrams.Description": 1,
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

  // TODO: temp soz, will fix
  // eslint-disable-next-line max-len
  public async searchPackages(queryOptions: IPackageQueryOptions, take: number, page: number, sort: PackageSortFields | "SearchScore", order: SortOrder): Promise<[Omit<IPackage, "_id">[], number]> {
    const optionFields = Object.values(queryOptions).filter(e => e != null);

    // error if query AND another field is set (query only requirement)
    if (queryOptions.query != null && optionFields.length > 1) {
      throw new Error("no other queryOptions should be set when 'query' is non-null");
    }

    // dont run the complicated shit if theres no need to
    if (optionFields.length === 0) {
      const allPkgs = await this.repository.findAndCount({
        take,
        skip: page * take,
        order: {
          [sort]: order,
        },
      });

      return [
        allPkgs[0].map(e => {
          delete e._id;
          return e;
        }),
        allPkgs[1],
      ];
    }

    // cant text search single fields, there can only be one text index per collection
    const ngramQuery = optionFields.map((e: string | string[]) => {
      if (e instanceof Array) {
        return e.map(f => generateNGrams(f, 2).join(" ")).join(" ");
      }
      return generateNGrams(e, 2).join(" ");
    }).join(" ");

    const pkgs = await this.repository.aggregate([
      {
        $match: {
          $and: [
            {
              $text: {
                $search: ngramQuery,
              },
            },
            {
              // NOTE: tags will be used to bump up the weight of searches but wont be
              // checked against a regex, would have to exact match to make sense and thats
              // just not worth it (perf vs how much it would improve results)
              $or: [
                // at least 1 should be set unless someone fucked up
                // NOTE: the value passed into escapeRegex should never be null without the '?? ""' but ts complained
                ...((queryOptions.query ?? queryOptions.name) == null ? [] : [
                  {
                    "Latest.Name": {
                      $regex: new RegExp(`.*${escapeRegex(queryOptions.query ?? queryOptions.name ?? "")}.*`, "i"),
                    },
                  },
                ]),
                ...((queryOptions.query ?? queryOptions.publisher) == null ? [] : [
                  {
                    "Latest.Publisher": {
                      $regex: new RegExp(`.*${escapeRegex(queryOptions.query ?? queryOptions.publisher ?? "")}.*`, "i"),
                    },
                  },
                ]),
                ...((queryOptions.query ?? queryOptions.description) == null ? [] : [
                  {
                    "Latest.Description": {
                      $regex: new RegExp(`.*${escapeRegex(queryOptions.query ?? queryOptions.description ?? "")}.*`, "i"),
                    },
                  },
                ]),
              ],
            },
          ],
        },
      },
      {
        $facet: {
          total: [
            {
              $count: "count",
            },
          ],
          results: [
            {
              $sort: {
                ...(sort === "SearchScore" ? {
                  score: {
                    $meta: "textScore",
                  },
                } : {
                  [sort]: order,
                }),
                // in case there are multiple docs with the same date
                Id: -1,
              },
            },
            {
              $skip: page * take,
            },
            {
              $limit: take,
            },
            {
              $unset: "_id",
            },
            {
              $addFields: {
                SearchScore: {
                  $meta: "textScore",
                },
              },
            },
          ],
        },
      },
      {
        $unwind: "$total",
      },
      {
        $replaceRoot: {
          newRoot: {
            total: "$total.count",
            results: "$results",
          },
        },
      },
    ]).next();

    return [pkgs?.results ?? [], pkgs?.total ?? 0];
  }

  // NOTE: shitty typeorm types
  // yes i have to use the aggregation pipeline unfortunately, cunty typeorm returns documents
  // even if they dont match if i specify any of take, skip, order, etc. actually fucking RETARDED
  // eslint-disable-next-line max-len
  public async findByPublisher(publisher: string, take: number, page: number, sort: PackageSortFields, order: SortOrder): Promise<[Omit<IPackage, "_id">[], number]> {
    const pkgs = await this.repository.aggregate([
      {
        $match: {
          Id: {
            $regex: new RegExp(`^${publisher}\\.`),
          },
        },
      },
      {
        $facet: {
          total: [
            {
              $count: "count",
            },
          ],
          results: [
            {
              $sort: {
                [sort]: order,
              },
            },
            {
              $skip: page * take,
            },
            {
              $limit: take,
            },
            {
              $unset: "_id",
            },
          ],
        },
      },
      {
        $unwind: "$total",
      },
      {
        $replaceRoot: {
          newRoot: {
            total: "$total.count",
            results: "$results",
          },
        },
      },
    ]).next();

    return [pkgs?.results ?? [], pkgs?.total ?? 0];
  }

  public async findSinglePackage(publisher: string, packageName: string): Promise<Omit<IPackage, "_id"> | undefined> {
    const pkg = await this.repository.findOne({
      Id: `${publisher}.${packageName}`,
    });

    delete pkg?._id;

    return pkg;
  }
}

export default PackageService;
