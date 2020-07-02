import { FastifyInstance } from "fastify";
import { StatsService, StatsResolution } from "../../../database";

const statsSchema = {
  querystring: {
    type: "object",
    properties: {
      packageId: {
        type: "string",
      },
      resolution: {
        type: "string",
        enum: Object.values(StatsResolution),
        nullable: true,
      },
      after: {
        type: "Date",
        nullable: true,
      },
      before: {
        type: "Date",
        nullable: true,
      },
    },
  },
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.get("/", { schema: statsSchema }, async request => {
    const {
      packageId,
      resolution = StatsResolution.Day,
      after, // TODO: IMPORTANT! default?
      before = new Date(),
    } = request.query;

    const statsService = new StatsService();
    const stats = statsService.getPackageStats(packageId, resolution, after, before);

    return {
      stats,
    };
  });
};
