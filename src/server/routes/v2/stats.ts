import { FastifyInstance } from "fastify";
import { StatsService, StatsResolution } from "../../../database";

const statsSchema = {
  querystring: {
    type: "object",
    required: ["packageId", "resolution", "after"],
    properties: {
      packageId: {
        type: "string",
      },
      resolution: {
        type: "string",
        enum: Object.values(StatsResolution),
      },
      after: {
        type: "string",
      },
      before: {
        type: "string",
        nullable: true,
      },
    },
  },
};

export default async (fastify: FastifyInstance): Promise<void> => {
  const statsService = new StatsService();

  fastify.get("/", { schema: statsSchema }, async (request, response) => {
    const {
      packageId,
      resolution,
      after,
      before = (new Date()).toISOString(),
    } = request.query;

    if (packageId == null) {
      response.code(404);
      throw new Error("package id not specified, please do that");
    }

    const stats = await statsService.getPackageStats(packageId, resolution, new Date(after), new Date(before));

    return {
      Stats: {
        Id: packageId,
        Data: stats,
      },
    };
  });
};
