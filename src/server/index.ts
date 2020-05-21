import buildFastify from "./buildFastify";

const WEBSERVER_LOGGER = true;
const WEBSERVER_PORT = 3000;
const WEBSERVER_ADDRESS = "0.0.0.0";

const startServer = async (): Promise<void> => {
  const server = buildFastify({
    logger: WEBSERVER_LOGGER,
  });

  try {
    await server.listen(WEBSERVER_PORT, WEBSERVER_ADDRESS);
    server.log.info(`winget magic happens on port ${WEBSERVER_PORT}`);
  } catch (error) {
    server.log.error(error);
    process.exit(-1);
  }
};

export {
  // eslint-disable-next-line import/prefer-default-export
  startServer,
};
