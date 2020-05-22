import muuid from "uuid-mongodb";
import { Binary } from "bson";
import { Column, PrimaryColumn } from "typeorm";

import { IBase } from "../types/base";

class BaseModel implements IBase {
  @PrimaryColumn()
  _id!: object;

  @Column()
  __v!: number;

  @Column()
  createdAt!: Date;

  @Column()
  updatedAt!: Date;

  // virtuals
  public get uuid(): string {
    return muuid.from(this._id as Binary).toString();
  }
}

export default BaseModel;
