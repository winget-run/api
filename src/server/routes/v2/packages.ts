import { FastifyInstance } from "fastify";
import { PackageService, StatsService } from "../../../database";
import { PackageSortFields, SortOrder } from "../../../database/types";

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 24;

const packageSchema = {
  querystring: {
    type: "object",
    properties: {
      query: {
        type: "string",
        minLength: 1,
      },
      name: {
        type: "string",
        minLength: 1,
      },
      publisher: {
        type: "string",
        minLength: 1,
      },
      description: {
        type: "string",
        minLength: 1,
      },
      tags: {
        type: "string",
        minLength: 1,
      },
      take: {
        type: "number",
        min: 1,
        max: MAX_PAGE_SIZE,
      },
      page: {
        type: "number",
        min: 0,
      },
      sort: {
        type: "string",
        enum: Object.values(PackageSortFields),
      },
      order: {
        type: "number",
        enum: [...Object.values(SortOrder), "SearchScore"],
      },
      splitQuery: {
        type: "boolean",
      },
      partialMatch: {
        type: "boolean",
      },
      ensureContains: {
        type: "boolean",
      },
    },
  },
};

const publisherPackageSchema = {
  params: {
    type: "object",
    required: ["publisher"],
    properties: {
      publisher: {
        type: "string",
        minLength: 1,
      },
    },
  },
  querystring: {
    type: "object",
    properties: {
      take: {
        type: "number",
        min: 1,
      },
      page: {
        type: "number",
        min: 0,
      },
      sort: {
        type: "string",
        enum: Object.values(PackageSortFields),
      },
      order: {
        type: "number",
        enum: Object.values(SortOrder),
      },
    },
  },
};

const singlePackageSchema = {
  params: {
    type: "object",
    required: ["publisher", "packageName"],
    properties: {
      publisher: {
        type: "string",
        minLength: 1,
      },
      packageName: {
        type: "string",
        minLength: 1,
      },
    },
  },
};

export default async (fastify: FastifyInstance): Promise<void> => {
  const packageService = new PackageService();
  const statsService = new StatsService();

  // NOTE: query searches name > publisher > description
  // NOTE: tags are exact match, separated by ','
  fastify.get("/", { schema: packageSchema }, async request => {
    const {
      query,
      name,
      publisher,
      description,
      tags,
      take = DEFAULT_PAGE_SIZE,
      page = DEFAULT_PAGE,
      sort = "SearchScore",
      order = SortOrder.ASCENDING,
      splitQuery = true,
      partialMatch = false,
      ensureContains = false,
    } = request.query;

    // NOTE: fastify auto parses it as a boolean (yay!)
    const searchOptions = {
      splitQuery,
      partialMatch,
      ensureContains,
    };

    const [pkgs, total] = await packageService.searchPackages({
      query,
      name,
      publisher,
      description,
      ...(tags == null ? {} : { tags: tags.split(",") }),
    }, take, page, sort, order, searchOptions);

    return {
      Packages: pkgs,
      Total: total,
    };
  });

  fastify.get("/:publisher", { schema: publisherPackageSchema }, async (request, response) => {
    const { publisher } = request.params;
    const {
      take = DEFAULT_PAGE_SIZE,
      page = DEFAULT_PAGE,
      sort = PackageSortFields.LatestName,
      order = SortOrder.ASCENDING,
    } = request.query;

    if (publisher == null) {
      response.code(404);
      throw new Error("publisher not specified, please do that");
    }

    const [pkgs, total] = await packageService.findByPublisher(publisher, take, page, sort, order);

    return {
      Packages: pkgs,
      Total: total,
    };
  });

  fastify.get("/:publisher/:packageName", { schema: singlePackageSchema }, async (request, response) => {
    const { publisher, packageName } = request.params;

    if (publisher == null || packageName == null) {
      response.code(404);
      throw Error("publisher or package name not specified, please do that");
    }

    const pkg = await packageService.findSinglePackage(publisher, packageName);
    if (pkg == null) {
      response.code(404);
      throw new Error("package not found");
    }

    statsService.incrementAccessCount(`${publisher}.${packageName}`);

    return {
      Package: pkg,
    };
  });
};
