import { IBase } from ".";

enum StatsResolution {
  Hour = "hour",
  Day = "day",
  Week = "isoWeek",
  Month = "month",
}

interface IStats extends IBase {
  PackageId: string;
  Period: number;
  Value: number;
}

interface IStatsSeries {
  Period: Date;
  Value: number;
}

export {
  StatsResolution,
  IStats,
  IStatsSeries,
};
