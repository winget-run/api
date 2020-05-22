import { FastifyInstance } from "fastify";

import { ratelimit } from "../../plugins";

export default async (fastify: FastifyInstance): Promise<void> => {
  // TODO: implement
  fastify.setErrorHandler(async () => ({
    cunt: "error",
  }));

  fastify.register(ratelimit, {
    nonce: "yes",
  });

  fastify.get("/search", async () => ({
    cunt: "/search",
  }));

  fastify.get("/autocomplete", async () => ({
    cunt: "/autocomplete",
  }));

  fastify.get("/:org", async () => ({
    cunt: "/:org",
  }));

  fastify.get("/:org/:pkg", async () => ({
    cunt: "/:org/:pkg",
  }));
};
