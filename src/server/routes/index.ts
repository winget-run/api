import { FastifyInstance } from "fastify";

import { PackageService } from "../../database";

import v1 from "./v1";
import v2 from "./v2";

export default async (fastify: FastifyInstance): Promise<void> => {
  const packageService = new PackageService();

  fastify.get("/", async () => ({
    nonce: "cunty mcjim",
    rawrxd: "rawrxd",
  }));

  fastify.get("/healthz", async (request, reply) => {
    // test if the database conn is still ok (we dont currently have alerting for db errors)
    await packageService.findOne({
      filters: {},
    });

    reply.status(204);
  });

  fastify.register(v1, { prefix: "v1" });
  fastify.register(v2, { prefix: "v2" });
};
