import "reflect-metadata";

import { connect } from "./database";
import { startServer } from "./server";

// TODO: add a way to quickly deploy changes if only the /chart folder changes
// TODO: make api more flexible - allow passing in of more parameters, like sort, etc, etc (v2?)
// TODO: go through all db stuff and make sure it works and returns the correct shit
// TODO: security report fixes
// TODO: process.env type definitions + runtime type checking
// TODO: make all necessary consts env vars
// TODO: all the testing
// TODO: use a separate db for this shit lmao (blocked by that mongo ops shite)
// TODO: migrations?
// TODO: importance of resilience and proper error handling (were dealing with shitty user uploaded data),
// nothing should go down if half the shit catches fire
(async (): Promise<void> => {
  try {
    await connect();
    await startServer();
  } catch (error) {
    console.error(`startup error: ${error}`);
    process.exit(-1);
  }
})();
