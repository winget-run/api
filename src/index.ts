import "reflect-metadata";

import { connect } from "./database";
import { startServer } from "./server";

// TODO: add a way to quickly deploy changes if only the /chart folder changes
// TODO: go through all db stuff and make sure it works and returns the correct shit
// TODO: process.env type definitions + runtime type checking
// TODO: all the testing
// TODO: migrations?
// TODO: importance of resilience and proper error handling (were dealing with shitty user uploaded data),
// nothing should go down if half the shit catches fire
// TODO: yarn plug n play
// TODO: restrict access to dev-*.winget.run !important;
// TODO: a script/cron job? which mirrors prod -> dev db
// TODO: make it so more than 1 person can use telepresence at once
// TODO: when we restrict dev, make it always run on NODE_ENV=dev
// TODO: make a public devops repo (minus secrets), and a separate secrets repo, also clean up the devops shite!
(async (): Promise<void> => {
  try {
    await connect();
    await startServer();
  } catch (error) {
    console.error(`startup error: ${error}`);
    process.exit(-1);
  }
})();
