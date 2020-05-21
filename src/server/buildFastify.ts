import Fastify, { FastifyInstance } from "fastify";

const buildFastify = (settings = {}): FastifyInstance => {
  const fastify = Fastify(settings);

  fastify.get("/", async () => ({
    nonce: "mattheousfans",
  }));

  return fastify;
};

export default buildFastify;
