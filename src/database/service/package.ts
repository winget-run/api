import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import PackageModel from "../model/package";

class PackageService extends BaseService<PackageModel> {
  repository = getMongoRepository(PackageModel);
}

export default PackageService;
