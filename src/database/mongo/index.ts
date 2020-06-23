import { connect, field, collection } from "./core";
import { FieldType } from "./types";

@collection()
class Cunt {
  @field({
    required: true,
  })
  rawrxd = "i love dicc";

  @field({
    required: true,
  })
  dick!: string;

  @field()
  gay!: string;

  @field()
  tranny!: string;

  get aids(): string {
    return this.dick;
  }

  set cancer(value: string) {
    this.gay = value;
  }

  hmmm(): string {
    return `i love munching on some ${this.dick}`;
  }
}

(async () => {
  try {
    await connect();
    console.log("connected to mongo");

    const cunt = new Cunt({
      dick: "yes daddy",
    });
  } catch (error) {
    console.error(`oof: ${error}`);
  }
})();
