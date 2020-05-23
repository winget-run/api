import { FastifyInstance } from "fastify";

import { ratelimit } from "../../plugins";
import { PackageService } from "../../../database";

import { request } from "http";
import ghService from "../../ghService/index";

const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_AUTOCOMPLETE_SIZE = 3;

// TODO: validation
export default async (fastify: FastifyInstance): Promise<void> => {
  // TODO: implement
  fastify.setErrorHandler(async (error) => ({
    cunt: `oofie owie i made a fucky-${error}-wucky`,
  }));

  fastify.register(ratelimit, {
    nonce: "yes",
  });

  fastify.get("/search", async (request) => {
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

  fastify.get("/autocomplete", async (request) => {
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
    ]).then((e) =>
      e.flat().filter((f, i, a) => a.findIndex((g) => g.uuid === f.uuid) === i)
    );

    return {
      packages,
    };
  });

  // TODO: deal with regex string search
  fastify.get("/:org", async (request) => {
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

  fastify.get("/:org/:pkg", async (request) => {
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

  //* import yaml endpoint
  fastify.get("/ghs/import", async (request) => {
    const yamls = await ghService.initialPackageImport();

    return yamls;
  });
};
