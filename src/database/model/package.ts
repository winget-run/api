import { Column, Entity } from "typeorm";

import BaseModel from "./base";
import { IPackage } from "../types/package";

@Entity()
class PackageModel extends BaseModel implements IPackage {
  @Column()
  packageId!: string;
}

export default PackageModel;
