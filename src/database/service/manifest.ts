import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import { ManifestModel } from "../model";
import {
  IManifest,
  IBaseInsert,
  IBaseUpdate,
  IBaseFilters,
  SortOrder,
} from "../types";
import { mapInternalFilters, escapeRegex } from "../helpers";

// yes ik, dependency injection, i swear i will later
class ManifestService extends BaseService<ManifestModel> {
  protected repository = getMongoRepository(ManifestModel);

  // index stuff
  public async setupIndices(): Promise<void> {
    await this.repository.createCollectionIndex({
      Id: 1,
      Version: 1,
    }, {
      unique: true,
    });
  }

  // checks if there is a manifest with the given id and version (should only be 1)
  // returns the manifest (if existent) or null (if non-existent)
  public async findManifestVersion(id: string, version: string): Promise<Omit<IManifest, "_id"> | undefined> {
    const manifest = await this.findOne({
      filters: {
        PackageIdentifier: id,
        PackageVersion: version,
      },
    });

    delete manifest?._id;

    return manifest;
  }

  // inserts a manifest into the database
  public async insertManifest(manifest: IBaseInsert<IManifest>): Promise<void> {
    await this.insertOne(manifest);
  }

  // update the fields on all manifests with the given id
  public async updateManifests(id: string, updateFields: IBaseUpdate<IManifest>): Promise<void> {
    await this.updateOne({
      filters: {
        PackageIdentifier: id,
      },
      update: updateFields,
    });
  }

  // update the fields on a single manifest with the given version and id
  public async updateManifestVersion(id: string, version: string, updateFields: IBaseUpdate<IManifest>): Promise<void> {
    await this.updateOne({
      filters: {
        PackageIdentifier: id,
        PackageVersion: version,
      },
      update: updateFields,
    });
  }

  // create a manifest if it doesnt already exist (matched id and version), otherwise update the existing one
  public async upsertManifest(manifest: IBaseInsert<IManifest>): Promise<void> {
    const { PackageIdentifier: id, PackageVersion: version } = manifest;

    // shitty validation (until i do better validation) for something that can
    // potentially seriously fuck shit up
    if (id == null || version == null) {
      throw new Error("id and/or manifest version not set");
    }

    await this.repository.updateOne(
      {
        Id: id,
        Version: version,
      },
      {
        $set: manifest,
      },
      {
        upsert: true,
      },
    );
  }

  // remove all manifests with the given id
  public async removeManifests(id: string): Promise<void> {
    await this.delete({
      PackageIdentifier: id,
    });
  }

  // remove a single manifest that matched the given id and version
  public async removeManifestVersion(id: string, version: string): Promise<void> {
    await this.deleteOne({
      PackageIdentifier: id,
      PackageVersion: version,
    });
  }

  // *** legacy package stuff ***

  // TODO: this doesnt return all fields on PackageModel, reflect that in the typings
  // TODO: also especially the stuff with diff versions is totally unlike the model types lmao
  // TODO: remove the anys
  // TODO: we shouldnt need the Version toString converstion, this is probably because:
  // input data is fucked, so fix the input, check why tf our validation didnt work, and remove the conversions
  // TODO: sort should not be string, it should be limited to fields on PackageModel
  // (give or take a few), also make the default a const and move it or make the opts thing an object <--- THIS
  // TODO: allow multiple field sort
  // TODO: remove this max len thing
  private async findPackages(
    filters: IBaseFilters<ManifestModel>,
    take: number,
    skip = 0,
    sort = "Name",
    order = SortOrder.ASCENDING,
  ): Promise<[ManifestModel[], number]> {
    //
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
  public async findAutocomplete(query: string, take: number): Promise<ManifestModel[]> {
    try {
      // TODO: remove the any (part of todos from above)
      const results = Promise.all(
        [
          this.findPackages({ PackageName: new RegExp(`.*${escapeRegex(query)}.*`, "i") }, take),
          this.findPackages({ Publisher: new RegExp(`.*${escapeRegex(query)}.*`, "i") }, take),
          this.findPackages({ ShortDescription: new RegExp(`.*${escapeRegex(query)}.*`, "i") }, take),
        ],
      ).then(e => e
        .flatMap(f => f[0])
        .slice(0, take)
        .filter((f, i, a) => a.findIndex(g => g.PackageIdentifier === f.PackageIdentifier) === i)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((f: any) => ({
          ...f,
          latest: {
            Version: f.latest.Version,
            Name: f.latest.Name,
            Publisher: f.latest.Publisher,
            Description: f.latest.Description,
            Homepage: f.latest.Homepage,
            // IconUrl: f.latest.IconUrl,
          },
        })));

      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  // TODO: sort should not be string, it should be limited to fields on PackageModel (give or take a few)
  public async findByName(name: string, take: number, skip: number, sort: string, order: number): Promise<[ManifestModel[], number]> {
    const [packages, total] = await this.findPackages({ PackageName: new RegExp(`.*${escapeRegex(name)}.*`, "i") }, take, skip, sort, order);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packageBasicInfo = packages.map((f: any) => ({
      ...f,
      latest: {
        Version: f.latest.Version,
        Name: f.latest.Name,
        Publisher: f.latest.Publisher,
        Description: f.latest.Description,
        Homepage: f.latest.Homepage,
        // IconUrl: f.latest.IconUrl,
      },
    }));

    return [packageBasicInfo, total];
  }

  public async findByOrg(org: string, take: number, skip: number): Promise<[ManifestModel[], number]> {
    const [packages, total] = await this.findPackages({ PackageIdentifier: new RegExp(`^${escapeRegex(org)}\\..*`, "i") }, take, skip);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packageBasicInfo = packages.map((f: any) => ({
      ...f,
      latest: {
        Version: f.latest.Version,
        Name: f.latest.Name,
        Publisher: f.latest.Publisher,
        Description: f.latest.Description,
        Homepage: f.latest.Homepage,
        // IconUrl: f.latest.IconUrl,
      },
    }));

    return [packageBasicInfo, total];
  }

  public async findByPackage(org: string, pkg: string): Promise<ManifestModel | null> {
    const [packages] = await this.findPackages({ PackageIdentifier: new RegExp(`^${escapeRegex(org)}\\.${escapeRegex(pkg)}$`, "i") }, 1);

    return packages[0];
  }
}

export default ManifestService;
