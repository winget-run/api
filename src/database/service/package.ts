import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import PackageModel from "../model/package";
import { IBaseFilters } from "../types";
import { mapInternalFilters } from "../helpers";

class PackageService extends BaseService<PackageModel> {
  repository = getMongoRepository(PackageModel);

  // TODO: this doesnt return all fields on PakcageModel, reflect that in the typings
  // TODO: also especially the stuff with diff versions is totally unlike the model types lmao
  // TODO: remove the anys
  private async findPackages(filters: IBaseFilters<PackageModel>, take: number, skip = 0): Promise<[PackageModel[], number]> {
    try {
      const internalFilters = mapInternalFilters(filters);

      const result = await this.repository.aggregate([
        {
          $match: internalFilters,
        },
        {
          $sort: {
            Version: -1,
          },
        },
        {
          $group: {
            _id: "$Id",
            versions: {
              $push: "$Version",
            },
            latest: {
              $first: "$$ROOT",
            },
          },
        },
        {
          $project: {
            _id: 0,
            Id: "$_id",
            versions: "$versions",
            latest: "$latest",
          },
        },
        {
          $unset: [
            "latest._id",
            "latest.Id",
          ],
        },
        {
          $facet: {
            total: [
              {
                $count: "value",
              },
            ],
            packages: [
              {
                $sort: {
                  _id: 1,
                },
              },
              {
                $skip: skip * take,
              },
              {
                $limit: take,
              },
            ],
          },
        },
        {
          $unwind: "$total",
        },
        {
          $project: {
            total: "$total.value",
            packages: "$packages",
          },
        },
      ]).toArray();

      return [result[0]?.packages ?? [], result[0]?.total ?? 0];
    } catch (error) {
      throw new Error(error);
    }
  }

  // TODO: add an option to pass in the fields that you want on the package part of the response (and get rid of those dorty maps)
  public async findAutocomplete(query: string, take: number): Promise<PackageModel[]> {
    try {
      // TODO: remove the any (part of todos from above)
      const results = Promise.all(
        [
          this.findPackages({ Name: new RegExp(`.*${query}.*`, "i") }, take),
          this.findPackages({ Publisher: new RegExp(`.*${query}.*`, "i") }, take),
          this.findPackages({ Description: new RegExp(`.*${query}.*`, "i") }, take),
        ],
      ).then(e => e
        .flatMap(f => f[0])
        .slice(0, take)
        .filter((f, i, a) => a.findIndex(g => g.Id === f.Id) === i)
        .map((f: any) => ({
          ...f,
          latest: {
            Version: f.latest.Version,
            Name: f.latest.Name,
            Publisher: f.latest.Publisher,
            Description: f.latest.Description,
          },
        })));

      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  public async findByName(name: string, take: number, skip: number): Promise<[PackageModel[], number]> {
    const [packages, total] = await this.findPackages({ Name: new RegExp(`.*${name}.*`, "i") }, take, skip);

    const packageBasicInfo = packages.map((f: any) => ({
      ...f,
      latest: {
        Version: f.latest.Version,
        Name: f.latest.Name,
        Publisher: f.latest.Publisher,
        Description: f.latest.Description,
      },
    }));

    return [packageBasicInfo, total];
  }

  public async findByOrg(org: string, take: number, skip: number): Promise<[PackageModel[], number]> {
    const [packages, total] = await this.findPackages({ Id: new RegExp(`${org}\\..*`, "i") }, take, skip);

    const packageBasicInfo = packages.map((f: any) => ({
      ...f,
      latest: {
        Version: f.latest.Version,
        Name: f.latest.Name,
        Publisher: f.latest.Publisher,
        Description: f.latest.Description,
      },
    }));

    return [packageBasicInfo, total];
  }

  public async findByPackage(org: string, pkg: string, take: number, skip: number): Promise<PackageModel | null> {
    const [packages] = await this.findPackages({ Id: new RegExp(`${org}\\.${pkg}`, "i") }, take, skip);

    return packages[0];
  }
}

export default PackageService;
