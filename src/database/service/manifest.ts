import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import { ManifestModel } from "../model";
import {
  IManifest,
  IBaseInsert,
  IBaseUpdate,
} from "../types";

// yes ik, dependency injection, i swear i will later
class ManifestService extends BaseService<ManifestModel> {
  protected repository = getMongoRepository(ManifestModel);

  // checks if there are manifests with a certain id in the database
  // returns an array of the manifests with given id (res.length === 0 -> no manifests)
  public async checkManifestsExist(id: string): Promise<ManifestModel[]> {
    const manifests = await this.find({
      filters: {
        Id: id,
      },
    });

    return manifests;
  }

  // checks if there is a manifest with the given id and version (should only be 1)
  // returns the manifest (if existent) or null (if non-existent)
  public async checkManifestVersionExists(id: string, version: string): Promise<ManifestModel | undefined> {
    const manifest = await this.findOne({
      filters: {
        Id: id,
        Version: version,
      },
    });

    return manifest;
  }

  // inserts a manifest into the database
  // TODO: verify that Id-Version fields are unique (no need for additional checks here then)
  public async insertManifest(manifest: IBaseInsert<IManifest>): Promise<void> {
    await this.insertOne(manifest);

    // ```
    //   PACKAGE:
    //   - check if other versions present
    //     - yes?
    //       - append new version
    //       - check if latest
    //         - yes?
    //           - update fields
    //     - no?
    //       - create new package
    // ```
  }

  // update the fields on all manifests with the given id
  public async updateManifests(id: string, updateFields: IBaseUpdate<IManifest>): Promise<void> {
    await this.updateOne({
      filters: {
        Id: id,
      },
      update: updateFields,
    });

    // ```
    //   PACKAGE:
    //   - update fields
    // ```
  }

  // update the fields on a single manifest with the given version and id
  public async updateManifestVersion(id: string, version: string, updateFields: IBaseUpdate<IManifest>): Promise<void> {
    await this.updateOne({
      filters: {
        Id: id,
        Version: version,
      },
      update: updateFields,
    });

    // ```
    //   PACKAGE:
    //   - check if latest version
    //     - yes?
    //       - update fields
    // ```
  }

  // create a manifest if it doesnt already exist (matched id and version), otherwise update the existing one
  public async upsertManifest(manifest: IBaseInsert<IManifest>): Promise<void> {
    const { Id: id, Version: version } = manifest;

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
      manifest,
      {
        upsert: true,
      },
    );

    // ```
    //   PACKAGE:
    //   - check if already exists (this version)
    //     - yes?
    //       - *** update (updateManifestVersion)
    //     - no?
    //       - *** insert (insertManifest)
    // ```
  }

  // remove all manifests with the given id
  public async removeManifests(id: string): Promise<void> {
    await this.delete({
      Id: id,
    });

    // ```
    //   PACKAGE:
    //   - remove package with Id
    // ```
  }

  // remove a single manifest that matched the given id and version
  public async removeManifestVersion(id: string, version: string): Promise<void> {
    await this.deleteOne({
      Id: id,
      Version: version,
    });

    // ```
    //   PACKAGE:
    //   - check if single version
    //     - yes?
    //       - remove
    //     -  no?
    //     - remove from version array
    //       - check if latest version
    //         - yes?
    //           - set fields to match new latest
    // ```
  }
}

export default ManifestService;
