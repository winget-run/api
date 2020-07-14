import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import PackageModel from "../model/package";
import {
  generateMetaphones,
  generateNGrams,
  dedupe,
  escapeRegex,
} from "../helpers";
import {
  IPackage,
  IBaseInsert,
  IPackageQueryOptions,
  SortOrder,
  PackageSortFields,
  IPackageSearchOptions,
} from "../types";

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

  public async searchPackages(
    queryOptions: IPackageQueryOptions,
    take: number,
    page: number,
    sort: PackageSortFields | "SearchScore",
    order: SortOrder,
    searchOptions: IPackageSearchOptions,
  ): Promise<[Omit<IPackage, "_id">[], number]> {
    //
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

    const processQueryInput = searchOptions.partialMatch === true ? (word: string): string[] => generateNGrams(word, 2) : generateMetaphones;

    const query = dedupe(optionFields.flat().map((e: string) => {
      if (searchOptions.splitQuery === true) {
        return e.split(" ").map(f => processQueryInput(f)).flat();
      }
      return processQueryInput(e);
    }).flat()).join(" ");

    // these vars can probs be set in a much nicer way (refactoring)
    const nameQuery = queryOptions.query ?? queryOptions.name ?? "";
    const publisherQuery = queryOptions.query ?? queryOptions.publisher ?? "";
    const descriptionQuery = queryOptions.query ?? queryOptions.description ?? "";

    const nameRegex = new RegExp(`.*(${
      searchOptions.splitQuery === false ? escapeRegex(nameQuery) : nameQuery.split(" ").map(e => escapeRegex(e)).join("|")
    }).*`, "i");
    const publisherRegex = new RegExp(`.*(${
      searchOptions.splitQuery === false ? escapeRegex(publisherQuery) : publisherQuery.split(" ").map(e => escapeRegex(e)).join("|")
    }).*`, "i");
    const descriptionRegex = new RegExp(`.*(${
      searchOptions.splitQuery === false ? escapeRegex(descriptionQuery) : descriptionQuery.split(" ").map(e => escapeRegex(e)).join("|")
    }).*`, "i");

    const pkgs = await this.repository.aggregate([
      {
        $match: {
          $and: [
            {
              $text: {
                $search: query,
              },
            },
            ...(searchOptions.ensureContains === false ? [] : [
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
                        $regex: nameRegex,
                      },
                    },
                  ]),
                  ...((queryOptions.query ?? queryOptions.publisher) == null ? [] : [
                    {
                      "Latest.Publisher": {
                        $regex: publisherRegex,
                      },
                    },
                  ]),
                  ...((queryOptions.query ?? queryOptions.description) == null ? [] : [
                    {
                      "Latest.Description": {
                        $regex: descriptionRegex,
                      },
                    },
                  ]),
                ],
              },
            ]),
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
  public async findByPublisher(
    publisher: string,
    take: number,
    page: number,
    sort: PackageSortFields,
    order: SortOrder,
  ): Promise<[Omit<IPackage, "_id">[], number]> {
    //
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
