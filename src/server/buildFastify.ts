import Fastify, { FastifyInstance } from "fastify";

const buildFastify = (settings = {}): FastifyInstance => {
  const fastify = Fastify(settings);

  fastify.get("/", async () => ({
    nonce: "me, i added the github secrets to the wrong repo lol",
  }));

  return fastify;
};

export default buildFastify;
