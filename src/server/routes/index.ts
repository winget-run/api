import { FastifyInstance } from "fastify";

import api from "./api";

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.get("/", async () => ({
    nonce: "rawrxd",
  }));

  fastify.register(api, { prefix: "api" });
};
