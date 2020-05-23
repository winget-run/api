import Fastify, { FastifyInstance } from "fastify";
import fastifyCors from "fastify-cors";

import routes from "./routes";

const {
  WEB_ADDRESS,
} = process.env;

const buildFastify = (settings = {}): FastifyInstance => {
  const fastify = Fastify(settings);

  fastify.register(fastifyCors, {
    origin: WEB_ADDRESS,
  });

  // TODO: since were using an api subdomain, we dont need the /api part in the url
  fastify.register(routes);

  return fastify;
};

export default buildFastify;
