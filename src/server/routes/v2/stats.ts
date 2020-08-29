import { FastifyInstance } from "fastify";
import moment from "moment";

import { StatsService, StatsResolution } from "../../../database";

const dayInMs = 1000 * 60 * 60 * 24;

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

    // limitations, decided to put them here as they are api imposed limitations rather
    // that ones imposed by functionality (like some query param combinations in search)
    let validDate = false;

    const afterDate = moment(after).utc().startOf(resolution);
    const beforeDate = moment(before).utc().startOf(resolution);

    // calculation: selected timeframe in ms <= allowed max timeframe
    const timeframeMs = beforeDate.valueOf() - afterDate.valueOf();

    switch (resolution) {
      case StatsResolution.Day: {
        validDate = timeframeMs <= dayInMs * 7 * 4;

        break;
      }
      case StatsResolution.Week: {
        validDate = timeframeMs <= dayInMs * 7 * 8;

        break;
      }
      case StatsResolution.Month: {
        validDate = timeframeMs <= dayInMs * 7 * 12;

        break;
      }
      // not required cos exhausitve switch but what do i know, right eslint?
      default: {
        response.code(500);
        throw new Error("were all fucked");
      }
    }

    if (!validDate) {
      response.code(400);
      throw new Error("invalid dates set, out of bounds of allowed values");
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
