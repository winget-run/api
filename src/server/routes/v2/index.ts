import { FastifyInstance } from "fastify";

import stats from "./stats";
import packages from "./packages";
import manifests from "./manifests";

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.register(stats, { prefix: "stats" });
  fastify.register(packages, { prefix: "packages" });
  fastify.register(manifests, { prefix: "manifests" });
};