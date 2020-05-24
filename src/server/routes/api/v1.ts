import { FastifyInstance } from "fastify";

import { ratelimit } from "../../plugins";
import { PackageService } from "../../../database";

import ghService from "../../ghService/index";
import PackageModel from "../../../database/model/package";

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

    const result = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yamls.map((yaml) => packageService.insertOne(yaml as any)),
    );

    return `imported ${yamls.length} packages at ${new Date().toISOString()}`;
  });

  //* update yaml endpoint
  fastify.get("/ghs/update", async () => {
    const updateYamls = await ghService.updatePackages();
    const packageService = new PackageService();

    console.log(updateYamls);

    Promise.all(updateYamls.map(yaml => {
        const pkg = JSON.stringify(yaml) as unknown as PackageModel;
        const pkgExist = packageService.findOneById(pkg.Id);
        if(pkgExist){
            packageService.updateOneById(pkg.Id, pkg);
        }else{
            packageService.insertOne(pkg);
        }
    }))

    return `${updateYamls.length} updated at ${new Date().toISOString()}`
  });

  // TODO: only send the name, org, and description here
  fastify.get("/search", { schema: searchSchema }, async request => {
    const { query, page = 0 } = request.query;

    const pkgService = new PackageService();
    const [packages, total] = await pkgService.findAndCount({
      filters: {
        Name: new RegExp(`.*${query}.*`, "i"),
      },
      select: ["Id", "Name", "Publisher", "Description"],
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
          Name: new RegExp(`.*${query}.*`, "i"),
        },
        take: DEFAULT_AUTOCOMPLETE_SIZE,
      }),
      pkgService.find({
        filters: {
          Publisher: new RegExp(`.*${query}.*`, "i"),
        },
        take: DEFAULT_AUTOCOMPLETE_SIZE,
      }),
      pkgService.find({
        filters: {
          Description: new RegExp(`.*${query}.*`, "i"),
        },
        take: DEFAULT_AUTOCOMPLETE_SIZE,
      }),
    ]).then((e) => e.flat().filter((f, i, a) => a.findIndex((g) => g.uuid === f.uuid) === i));

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
        Id: new RegExp(`${org}..*`, "i"),
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
        Id: new RegExp(`${org}.${pkg}`, "i"),
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
