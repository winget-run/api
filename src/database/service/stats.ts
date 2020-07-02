import { getMongoRepository } from "typeorm";

import BaseService from "./base";
import { StatsModel } from "../model";
import { StatsResolution, IStats } from "../types";

// 1 hour
// DO NOT CHANGE THIS!!!
const SAMPLING_PERIOD = 1000 * 60 * 60;

class StatsService extends BaseService<StatsModel> {
  repository = getMongoRepository(StatsModel);

  public async incrementAccessCount(packageId: string): Promise<void> {
    const currentPeriod = Math.floor(Date.now() / SAMPLING_PERIOD);

    await this.repository.updateOne(
      {
        PackageId: packageId,
        Period: currentPeriod,
      },
      {
        $set: {
          PackageId: packageId,
          Period: currentPeriod,
        },
        $inc: {
          Value: 1,
        },
      },
      {
        upsert: true,
      },
    );
  }

  public async getPackageStats(packageId: string, resolution: StatsResolution, after: Date, before: Date): Promise<IStats[]> {

  }
}

export default StatsService;
