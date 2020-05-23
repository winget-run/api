import { FastifyInstance } from "fastify";

import api from "./api";

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.register(api, { prefix: "api" });
};
