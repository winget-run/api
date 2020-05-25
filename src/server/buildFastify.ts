import Fastify, { FastifyInstance } from "fastify";
import fastifyCors from "fastify-cors";

import routes from "./routes";

const {
  WEB_ADDRESS,
} = process.env;

const buildFastify = (settings = {}): FastifyInstance => {
  const fastify = Fastify(settings);

  // TODO: this doesnt work for matt, big thonk
  fastify.register(fastifyCors, {
    origin: WEB_ADDRESS,
  });

  fastify.register(routes);

  return fastify;
};

export default buildFastify;
