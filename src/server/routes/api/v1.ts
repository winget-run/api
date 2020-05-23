import { FastifyInstance } from "fastify";

import { ratelimit } from "../../plugins";
import { PackageService } from "../../../database";

const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_AUTOCOMPLETE_SIZE = 3;

const searchSchema = {
  querystring: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
      },
      page: {
        type: "number",
        nullable: true,
      },
    },
  },
};

const autocompleteSchema = {
  querystring: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
      },
    },
  },
};

const orgSchema = {
  params: {
    type: "object",
    required: ["org"],
    properties: {
      org: {
        type: "string",
      },
    },
  },
  querystring: {
    type: "object",
    properties: {
      page: {
        type: "number",
        nullable: true,
      },
    },
  },
};

const orgPkgSchema = {
  params: {
    type: "object",
    required: ["org"],
    properties: {
      org: {
        type: "string",
      },
      pkg: {
        type: "string",
      },
    },
  },
  querystring: {
    type: "object",
    properties: {
      page: {
        type: "number",
        nullable: true,
      },
    },
  },
};

export default async (fastify: FastifyInstance): Promise<void> => {
  // TODO: implement
  fastify.setErrorHandler(async error => ({
    cunt: `oofie owie i made a fucky-(${error})-wucky`,
  }));

  fastify.register(ratelimit, {
    nonce: "yes",
  });

  fastify.get("/search", { schema: searchSchema }, async request => {
    const { query, page = 0 } = request.query;

    const pkgService = new PackageService();
    const [packages, total] = await pkgService.findAndCount({
      filters: {
        Name: new RegExp(`.*${query}.*`),
      },
      take: DEFAULT_PAGE_SIZE,
      skip: page * DEFAULT_PAGE_SIZE,
    });

    return {
      packages,
      total,
    };
  });

  fastify.get("/autocomplete", { schema: autocompleteSchema }, async request => {
    const { query } = request.query;

    const pkgService = new PackageService();
    const packages = await Promise.all([
      pkgService.find({
        filters: {
          Name: new RegExp(`.*${query}.*`),
        },
        take: DEFAULT_AUTOCOMPLETE_SIZE,
      }),
      pkgService.find({
        filters: {
          Publisher: new RegExp(`.*${query}.*`),
        },
        take: DEFAULT_AUTOCOMPLETE_SIZE,
      }),
      pkgService.find({
        filters: {
          Description: new RegExp(`.*${query}.*`),
        },
        take: DEFAULT_AUTOCOMPLETE_SIZE,
      }),
    ]).then(e => e.flat().filter((f, i, a) => a.findIndex(g => g.uuid === f.uuid) === i));

    return {
      packages,
    };
  });

  fastify.get("/:org", { schema: orgSchema }, async request => {
    const { org } = request.params;
    const { page = 0 } = request.query;

    const pkgService = new PackageService();
    const [packages, total] = await pkgService.findAndCount({
      filters: {
        Id: new RegExp(`${org}..*`),
      },
      take: DEFAULT_PAGE_SIZE,
      skip: page * DEFAULT_PAGE_SIZE,
    });

    return {
      packages,
      total,
    };
  });

  fastify.get("/:org/:pkg", { schema: orgPkgSchema }, async request => {
    const { org, pkg } = request.params;
    const { page = 0 } = request.query;

    const pkgService = new PackageService();
    const [packages, total] = await pkgService.findAndCount({
      filters: {
        Id: `${org}.${pkg}`,
      },
      take: DEFAULT_PAGE_SIZE,
      skip: page * DEFAULT_PAGE_SIZE,
    });

    return {
      packages,
      total,
    };
  });
};
