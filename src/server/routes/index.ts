import { FastifyInstance } from "fastify";

import v1 from "./v1";
import v2 from "./v2";

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.get("/", async () => ({
    nonce: "cunty mcjim",
    rawrxd: "rawrxd",
  }));

  fastify.register(v1, { prefix: "v1" });
  fastify.register(v2, { prefix: "v2" });
};
