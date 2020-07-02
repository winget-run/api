import { Column, Entity } from "typeorm";

import BaseModel from "./base";
import { IStats } from "../types";

@Entity()
class StatsModel extends BaseModel implements IStats {
  @Column()
  public PackageId!: string;

  @Column()
  public Period!: number;

  @Column()
  public Value!: number;
}

export default StatsModel;
