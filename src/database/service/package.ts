import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import PackageModel from "../model/package";
import { mapInternalFilters } from "../helpers";
import { IBaseFilters, SortOrder } from "../types";

// TODO: move this into a helpers file or something
// imo its important to call this here rather than in the routes, cant trust anyone using
// the PackageService api to know that regex needs to be escaped
// mdn: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
const escapeRegex = (str: string): string => str.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

class PackageService extends BaseService<PackageModel> {
  repository = getMongoRepository(PackageModel);

  // TODO: this doesnt return all fields on PackageModel, reflect that in the typings
  // TODO: also especially the stuff with diff versions is totally unlike the model types lmao
  // TODO: remove the anys
  // TODO: we shouldnt need the Version toString converstion, this is probably because:
  // input data is fucked, so fix the input, check why tf our validation didnt work, and remove the conversions
  // TODO: sort should not be string, it should be limited to fields on PackageModel
  // (give or take a few), also make the default a const and move it or make the opts thing an object <--- THIS
  // TODO: allow multiple field sort
  // TODO: remove this max len thing
  // eslint-disable-next-line max-len
  private async findPackages(filters: IBaseFilters<PackageModel>, take: number, skip = 0, sort = "Name", order = SortOrder.ASCENDING): Promise<[PackageModel[], number]> {
    try {
      const internalFilters = mapInternalFilters(filters);

      const result = await this.repository.aggregate([
        {
          $match: internalFilters,
        },
        {
          $addFields: {
            semver: {
              $reduce: {
                input: {
                  $map: {
                    input: {
                      $map: {
                        // if version has less than 4 parts, set the remaining ones to 0
                        input: {
                          $zip: {
                            inputs: [
                              {
                                $split: [
                                  {
                                    $convert: {
                                      input: "$Version",
                                      to: "string",
                                    },
                                  },
                                  ".",
                                ],
                              },
                              {
                                $range: [
                                  0,
                                  4,
                                ],
                              },
                            ],
                            useLongestLength: true,
                          },
                        },
                        as: "temp",
                        in: {
                          $ifNull: [
                            {
                              $arrayElemAt: [
                                "$$temp",
                                0,
                              ],
                            },
                            "0",
                          ],
                        },
                      },
                    },
                    as: "ver",
                    in: {
                      $concat: [
                        {
                          // get pad string, then pad each ver
                          $reduce: {
                            input: {
                              $range: [
                                0,
                                {
                                  $subtract: [
                                    // pad to the longest possible len
                                    // should be 5 chars per section (https://github.com/microsoft/winget-cli/blob/master/doc/ManifestSpecv0.1.md)
                                    // but apparently some peeps think that standards dont apply to them...
                                    // (https://github.com/microsoft/winget-pkgs/blob/master/manifests/Microsoft/dotnet/5.0.100-preview.4.yaml)
                                    // what a fucking cunt (also the utf-16 encoding wtf)
                                    5,
                                    {
                                      $strLenCP: {
                                        $convert: {
                                          input: "$$ver",
                                          to: "string",
                                        },
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                            initialValue: "",
                            in: {
                              $concat: [
                                "$$value",
                                "0",
                              ],
                            },
                          },
                        },
                        "$$ver",
                      ],
                    },
                  },
                },
                initialValue: "",
                // will leave a . at the end but thats fine for our purposes (sorting)
                in: {
                  $concat: [
                    "$$value",
                    "$$this",
                    ".",
                  ],
                },
              },
              // gets the length of the longest part (wont work cos wed need the global longest el len)
              // not worth the effort and imma assume the shit will follow standards
              // $max: {
              //   $map: {
              //     input: {
              //       $split: [
              //         {
              //           $convert: {
              //             input: "$Version",
              //             to: "string",
              //           },
              //         },
              //         ".",
              //       ],
              //     },
              //     in: {
              //       $strLenCP: "$$this",
              //     },
              //   },
              // },
            },
          },
        },
        {
          $sort: {
            semver: -1,
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
        // get total count of search results
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
                  [`latest.${sort}`]: order,
                  Id: -1,
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
        // clean up latest
        // TODO: these dont actually get deleted
        {
          $unset: [
            "latest._id",
            "latest.Id",

            // temp value used for sorting by version
            "latest.semver",
          ],
        },
        // clean up total
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
          this.findPackages({ Name: new RegExp(`.*${escapeRegex(query)}.*`, "i") }, take),
          this.findPackages({ Publisher: new RegExp(`.*${escapeRegex(query)}.*`, "i") }, take),
          this.findPackages({ Description: new RegExp(`.*${escapeRegex(query)}.*`, "i") }, take),
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
            Homepage: f.latest.Homepage,
            IconUrl: f.latest.IconUrl,
          },
        })));

      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  // TODO: sort should not be string, it should be limited to fields on PackageModel (give or take a few)
  public async findByName(name: string, take: number, skip: number, sort: string, order: number): Promise<[PackageModel[], number]> {
    const [packages, total] = await this.findPackages({ Name: new RegExp(`.*${escapeRegex(name)}.*`, "i") }, take, skip, sort, order);

    const packageBasicInfo = packages.map((f: any) => ({
      ...f,
      latest: {
        Version: f.latest.Version,
        Name: f.latest.Name,
        Publisher: f.latest.Publisher,
        Description: f.latest.Description,
        Homepage: f.latest.Homepage,
        IconUrl: f.latest.IconUrl,
      },
    }));

    return [packageBasicInfo, total];
  }

  public async findByOrg(org: string, take: number, skip: number): Promise<[PackageModel[], number]> {
    const [packages, total] = await this.findPackages({ Id: new RegExp(`^${escapeRegex(org)}\\..*`, "i") }, take, skip);

    const packageBasicInfo = packages.map((f: any) => ({
      ...f,
      latest: {
        Version: f.latest.Version,
        Name: f.latest.Name,
        Publisher: f.latest.Publisher,
        Description: f.latest.Description,
        Homepage: f.latest.Homepage,
        IconUrl: f.latest.IconUrl,
      },
    }));

    return [packageBasicInfo, total];
  }

  public async findByPackage(org: string, pkg: string): Promise<PackageModel | null> {
    const [packages] = await this.findPackages({ Id: new RegExp(`^${escapeRegex(org)}\\.${escapeRegex(pkg)}$`, "i") }, 1);

    return packages[0];
  }
}

export default PackageService;
