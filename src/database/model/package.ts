import { Column, Entity } from "typeorm";

import BaseModel from "./base";
import { IPackage } from "../types/package";

@Entity()
class PackageModel extends BaseModel implements IPackage {
  @Column()
  Id!: string;

  // version stuff
  @Column()
  Versions!: string[];

  @Column()
  Latest!: {
    Name: string;
    Publisher: string;
    Description?: string;
    License?: string;
  };

  // extra
  @Column()
  IconUrl?: string;

  // stats
  @Column()
  UpdatedAt!: Date;
}

export default PackageModel;
