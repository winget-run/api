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
    Tags: string[];
    Description?: string;
    Homepage?: string;
    License?: string;
    LicenseUrl?: string;
  };

  // extra
  @Column()
  Featured!: boolean;

  @Column()
  IconUrl?: string;

  @Column()
  Banner?: string;

  @Column()
  Logo?: string;

  // search
  @Column()
  NGrams!: {
    Name: string;
    Publisher: string;
    Tags?: string;
    Description?: string;
  };

  // stats
  @Column()
  UpdatedAt!: Date;
}

export default PackageModel;
