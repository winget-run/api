import { FastifyInstance } from "fastify";
import { PackageService } from "../../../database";

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
      skip: {
        type: "number",
        min: 0,
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
      skip: {
        type: "number",
        min: 0,
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

  // NOTE: query searches name > publisher > description
  // NOTE: tags are exact match, separated by ','
  fastify.get("/", { schema: packageSchema }, async request => {
    const {
      query,
      name,
      publisher,
      description,
      tags,
      take,
      skip,
    } = request.query;

    const pkgs = await packageService.searchPackages({
      query,
      name,
      publisher,
      description,
      ...(tags == null ? {} : { tags: tags.split(",") }),
    }, take, skip);

    return {
      Packages: pkgs,
    };
  });

  fastify.get("/:publisher", { schema: publisherPackageSchema }, async request => {
    const { publisher } = request.params;
    const { take, skip } = request.query;

    const pkgs = await packageService.findByPublisher(publisher, take, skip);

    return {
      Packages: pkgs,
    };
  });

  fastify.get("/:publisher/:packageName", { schema: singlePackageSchema }, async request => {
    const { publisher, packageName } = request.params;

    const pkg = await packageService.findSinglePackage(publisher, packageName);

    return {
      Package: pkg,
    };
  });
};