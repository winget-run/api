import "reflect-metadata";

// import fs from "fs";

// import dotenv from "dotenv";

// eslint-disable-next-line import/first
import { connect } from "./database";
// eslint-disable-next-line import/first
import { startServer } from "./server";

// if (process.env.NODE_ENV === "dev") {
//   // TODO: fix cos we shouldnt need this for kube shite
//   process.env = {
//     ...process.env,
//     ...dotenv.parse(fs.readFileSync(".env")),
//   };
// }
//

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
// TODO: remove createdAt, we dont need it cos we have _id
// TODO: yarn plug n play
// TODO: restrict access to dev-*.winget.run !important;
// TODO: a script/cron job? which mirrors prod -> dev db
// TODO: make it so more than 1 person can use telepresence at once
// TODO: when we restrict dev, make it always run on NODE_ENV=dev
// TODO: make a public devops repo (minus secrets), and a separate secrets repo, also clean up the devops shite!
// TODO: look into helm testing
// TODO: (actually a manifest issue) this shouldnt be a 500 https://winget.run/pkg/Abacus/classic.abacus.ch

// TODO: rename ci/cd github actions workflow to be consistent across repos
(async (): Promise<void> => {
  try {
    await connect();
    await startServer();
  } catch (error) {
    console.error(`startup error: ${error}`);
    process.exit(-1);
  }
})();

// TODO: testing
// unit
// integration
// regression
// e2e

// TODO: allow access to test db
