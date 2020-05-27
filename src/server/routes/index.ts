import { FastifyInstance } from "fastify";

import v1 from "./v1";

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.get("/", async () => ({
    nonce: "cunty mcjim",
  }));

  fastify.register(v1, { prefix: "v1" });
};
