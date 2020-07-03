import { getMongoRepository } from "typeorm";
import moment from "moment";

import BaseService from "./base";
import { StatsModel } from "../model";
import { StatsResolution, IStatsSeries, IStats } from "../types";

// 1 hour
// DO NOT CHANGE THIS!!!
const SAMPLING_PERIOD = 1000 * 60 * 60;

// TODO: move to a general helpers file or something
// const chunk = <T>(array: T[], size: number): T[][] => {
//   const chunked = [];

//   for (let i = 0; i < Math.ceil(array.length / Math.max(size, 1)); i += 1) {
//     chunked.push(array.slice(i * size, Math.min(i * size + size, array.length)));
//   }

//   return chunked;
// };

// const chunkStats = (stats: IStats[], startPeriod: number, resolution: StatsResolution): IStats[][] => {
//   const statsCopy = [...stats].sort((a, b) => a.Period - b.Period);

//   const chunkSize = RESOLUTION_CHUNK_SIZE[resolution];
//   if (chunkSize === 1) {
//     return statsCopy.map(e => [e]);
//   }

//   const firstChunkIndex = statsCopy.findIndex(e => e.Period >= startPeriod + chunkSize - (startPeriod % chunkSize));
//   const firstChunkSize = firstChunkIndex === -1 ? statsCopy.length : firstChunkIndex + 1;

//   const first = statsCopy.slice(0, firstChunkSize);
//   // TODO: skip if first contains everything
//   const rest = chunk(statsCopy.slice(firstChunkSize), chunkSize);

//   return [first, ...rest];
// };

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

    // const chunkSize = RESOLUTION_CHUNK_SIZE[resolution];

    // const chunked = chunkStats(stats, startPeriod, resolution);
    // const dates = chunked.map(e => new Date((e[0].Period - (e[0].Period % chunkSize)) * SAMPLING_PERIOD));
    // const values = chunked.map(e => e.reduce((a, c) => a + c.Value, 0));

    // const series = dates.map((e, i) => ({
    //   Period: e,
    //   Value: values[i],
    // }));

    return series;
  }
}

export default StatsService;
