import { FastifyInstance } from "fastify";

import { ratelimit } from "../../plugins";
import { PackageService } from "../../../database";

import ghService from "../../ghService/index";
import PackageModel from "../../../database/model/package";

const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 24;
const DEFAULT_PAGE_SIZE = 12;

const DEFAULT_AUTOCOMPLETE_SIZE = 3;

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

const searchSchema = {
  querystring: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
      },
      limit: {
        type: "number",
        nullable: true,
        minimum: MIN_PAGE_SIZE,
        maximum: MAX_PAGE_SIZE,
      },
      page: {
        type: "number",
        nullable: true,
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
      limit: {
        type: "number",
        nullable: true,
        minimum: MIN_PAGE_SIZE,
        maximum: MAX_PAGE_SIZE,
      },
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
    required: ["org", "pkg"],
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
      limit: {
        type: "number",
        nullable: true,
        minimum: MIN_PAGE_SIZE,
        maximum: MAX_PAGE_SIZE,
      },
      page: {
        type: "number",
        nullable: true,
      },
    },
  },
};

export default async (fastify: FastifyInstance): Promise<void> => {
  // TODO: implement
  fastify.setErrorHandler(async (error) => ({
    cunt: `oofie owie i made a fucky-(${error})-wucky`,
  }));

  fastify.register(ratelimit, {
    nonce: "yes",
  });

  //* import yaml endpoint
  fastify.get("/ghs/import", async () => {
    const yamls = await ghService.initialPackageImport();
    const packageService = new PackageService();

    console.log(yamls);

    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yamls.map((yaml) => packageService.insertOne(yaml as any)),
    );


    return `imported ${yamls.length} packages at ${new Date().toISOString()}`;
  });

  //* update yaml endpoint
  fastify.get("/ghs/update", async () => {
    const updateYamls = await ghService.updatePackages();

    if (updateYamls.length > 0) {
      const packageService = new PackageService();

      await Promise.all(updateYamls.map(async (yaml) => {
        const pkg = JSON.stringify(yaml) as unknown as PackageModel;
        const pkgExist = await packageService.findOneById(pkg.Id);

        if (pkgExist?.Id === pkg.Id && pkgExist.Version === pkg.Version) {
          packageService.updateOneById(pkg.Id, pkg);
        } else {
          packageService.insertOne(pkg);
        }
        return null;
      }));
    }

    return `${updateYamls.length} updated at ${new Date().toISOString()}`;
  });

  fastify.get("/autocomplete", { schema: autocompleteSchema }, async request => {
    const { query } = request.query;

    const pkgService = new PackageService();
    const packages = await pkgService.findAutocomplete(query, DEFAULT_AUTOCOMPLETE_SIZE);

    return {
      packages,
    };
  });

  fastify.get("/search", { schema: searchSchema }, async request => {
    const { name, limit = DEFAULT_PAGE_SIZE, page = 0 } = request.query;

    const pkgService = new PackageService();
    const [packages, total] = await pkgService.findByName(name, limit, page);

    return {
      packages,
      total,
    };
  });

  fastify.get("/:org", { schema: orgSchema }, async request => {
    const { org, limit = DEFAULT_PAGE_SIZE } = request.params;
    const { page = 0 } = request.query;

    const pkgService = new PackageService();
    const [packages, total] = await pkgService.findByOrg(org, limit, page);

    return {
      packages,
      total,
    };
  });

  fastify.get("/:org/:pkg", { schema: orgPkgSchema }, async request => {
    const { org, pkg, limit = DEFAULT_PAGE_SIZE } = request.params;
    const { page = 0 } = request.query;

    const pkgService = new PackageService();
    const orgPkg = await pkgService.findByPackage(org, pkg, limit, page);

    return {
      package: orgPkg,
    };
  });
};
