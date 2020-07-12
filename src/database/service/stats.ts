import { getMongoRepository } from "typeorm";
import moment from "moment";

import BaseService from "./base";
import { StatsModel } from "../model";
import { StatsResolution, IStatsSeries, IStats } from "../types";

// 1 hour
// DO NOT CHANGE THIS!!! (unless you know what youre doing lol)
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

  // NOTE: before and after are inclusive of the supplied dates
  public async getPackageStats(packageId: string, resolution: StatsResolution, after: Date, before: Date): Promise<IStatsSeries[]> {
    const startPeriod = Math.floor(after.getTime() / SAMPLING_PERIOD);
    const endPeriod = Math.floor(before.getTime() / SAMPLING_PERIOD);

    // need to do this due to bad typings in typeorm
    // TODO: also yes ik mongo can sort shit, typeorm has no docs for this and i cant be fucked rn
    const stats = await this.repository.find({
      Period: {
        $gte: startPeriod,
        $lte: endPeriod,
      } as unknown as number,
    });

    stats.sort((a, b) => a.Period - b.Period);

    const grouped: { [key: string]: IStats[] } = {};
    stats.forEach(stat => {
      const time = moment(stat.Period * SAMPLING_PERIOD).utc().startOf(resolution).toISOString();

      grouped[time] = [...grouped[time] ?? [], stat];
    });

    // [time, stat[]]
    const series = Object.entries(grouped).map(([k, v]) => ({
      Period: new Date(k),
      Value: v.reduce((a, c) => a + c.Value, 0),
    }));

    return series;
  }
}

export default StatsService;
