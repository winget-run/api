import { FastifyInstance } from "fastify";

// TODO: implement
export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.addHook("onRequest", async () => {
    fastify.log.info("ratelimit plugin called");
  });
};
