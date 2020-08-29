import { ServerResponse } from "http";

import { FastifyRequest, FastifyReply } from "fastify";

const {
  API_ACCESS_TOKEN,
} = process.env;

const validateApiToken = async (request: FastifyRequest, reply: FastifyReply<ServerResponse>): Promise<void> => {
  const accessToken = request.headers["xxx-access-token"];
  if (accessToken == null) {
    reply.status(401);
    throw new Error("unauthorised");
  }
  if (accessToken !== API_ACCESS_TOKEN) {
    reply.status(403);
    throw new Error("forbidden");
  }
};

export default validateApiToken;
