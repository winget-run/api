import { getMongoRepository } from "typeorm";

import fastify, { FastifyReply } from "fastify";
import { ServerResponse } from "http";
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

const {
  NODE_ENV,
} = process.env;

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
          "Search.Name": "text",
          "Search.Publisher": "text",
          "Search.Tags": "text",
          "Search.Description": "text",
        },
        // will probably always match the name first
        weights: {
          "Search.Name": 20,
          "Search.Publisher": 12,
          "Search.Tags": 10,
          "Search.Description": 4,
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
    response: fastify.FastifyReply<ServerResponse>,
  ): Promise<[Omit<IPackage & { SearchScore: number }, "_id">[], number]> {
    //
    const optionFields = Object.values(queryOptions).filter(e => e != null);

    // error if query AND another field is set (query only requirement)
    if (queryOptions.query != null && optionFields.length > 1) {
      response.code(400);
      throw new Error("no other queryOptions should be set when 'query' is non-null");
    }

    // error if non-query fields are set and ensureContains is false, in which case
    // all non-query fields behave like a qquery and may be misleading
    if (queryOptions.query == null && optionFields.length >= 1 && searchOptions.ensureContains === false) {
      response.code(400);
      throw new Error("non-query search parameters are redundant if ensureContains is false");
    }

    // dont run the complicated shit if theres no need to
    if (optionFields.length === 0) {
      const allPkgs = await this.repository.findAndCount({
        take,
        skip: page * take,
        // SearchScore doesnt apply here (were not doing any searching)
        ...(sort === "SearchScore" ? {} : {
          order: {
            [sort]: order,
          },
        }),
      });

      // NOTE: i want to have a search score set to 0 rather than it possibly being
      // undefined, its just easier to work with for anyone consuming the api
      return [
        allPkgs[0].map(e => ({
          ...e,
          // TODO: this is broke, fix when fixing the uuid issue
          uuid: undefined as unknown as string,

          _id: undefined,
          SearchScore: 0,
        })),
        allPkgs[1],
      ];
    }

    // NOTE: unlike generateNGrams, i dont want to edit the generateMetaphones fn itself as other ones
    // call it so something is likely to break (and i dont have unit tests for it so...)
    // in the future, it would be wise to have general useful fns and ones which transform the results
    // of those to a less universally usable format (like im doing here with the '_')
    const processQueryInput = searchOptions.partialMatch === true
      ? (word: string): string[] => generateNGrams(word, 2)
      : (word: string): string[] => generateMetaphones(word).map(e => e.padEnd(3, "_"));

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
                  // exact match for tags
                  // NOTE: im doing lowerCase stuff all over the place currently, in the future it would be better
                  // to do it in the api routes themselves and leave the db logic universal, so one api ver can be
                  // case sensitive/insensitive if something like that is required for example
                  ...((queryOptions.query ?? queryOptions.tags) == null ? [] : [
                    {
                      "Latest.Tags": {
                        $in: queryOptions.query != null ? [queryOptions.query.toLowerCase()] : queryOptions.tags?.map(e => e.toLowerCase()),
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
              $unset: [
                "_id",
                ...(NODE_ENV === "dev" ? [] : [
                  "Search",
                ]),
              ],
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
