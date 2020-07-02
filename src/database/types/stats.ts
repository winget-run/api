import { IBase } from ".";

enum StatsResolution {
  Hour = "hour",
  Day = "day",
  Week = "week",
}

interface IStats extends IBase {
  PackageId: string;
  Period: number;
  Value: number;
}

export {
  StatsResolution,
  IStats,
};
