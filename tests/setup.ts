import dotenv from "dotenv";
import sourceMapSupport from "source-map-support";

// set up env vars and source maps
// this is done via the cli when running code through node (non-test stuff)
dotenv.config();
sourceMapSupport.install();
