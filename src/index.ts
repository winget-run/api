import { startServer } from "./server";

(async (): Promise<void> => {
  try {
    await startServer();
  } catch (error) {
    console.error(`startup error: ${error}`);
    process.exit(-1);
  }
})();
