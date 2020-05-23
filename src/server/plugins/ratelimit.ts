import { FastifyInstance } from "fastify";

// TODO: implement
export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.addHook("onRequest", async () => {
    console.log("ratelimit plugin called");
  });
};
