import "reflect-metadata";

import { connect } from "./database";
import { startServer } from "./server";

// TODO: process.env type definitions + runtime type checking
// TODO: make all necessary consts env vars
// TODO: all the testing
// TODO: use a separate db for this shit lmao
// TODO: migrations?
(async (): Promise<void> => {
  try {
    await connect();
    await startServer();
  } catch (error) {
    console.error(`startup error: ${error}`);
    process.exit(-1);
  }
})();
