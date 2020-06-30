import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import PackageModel from "../model/package";
import { IPackage, IBaseInsert } from "../types";

class PackageService extends BaseService<PackageModel> {
  repository = getMongoRepository(PackageModel);

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
      pkg,
      {
        upsert: true,
      },
    );
  }
}

export default PackageService;
