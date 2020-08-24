import { FastifyInstance } from "fastify";

import { ratelimit } from "../../plugins";
import ghService from "../../ghService/index";
import { SortOrder } from "../../../database/types";
import { validateApiToken } from "../../helpers";
import {
  ManifestService,
  ManifestModel,
  addOrUpdatePackage,
  rebuildPackage,
  PackageService,
} from "../../../database";

// NOTE: spec: https://github.com/microsoft/winget-cli/blob/master/doc/ManifestSpecv0.1.md
// were more or less following it lel

const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 24;
const DEFAULT_PAGE_SIZE = 12;

const DEFAULT_AUTOCOMPLETE_SIZE = 3;

const {
  NODE_ENV,
} = process.env;

// TODO: split this file up
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
      sort: {
        type: "string",
        // TODO: make every field in PackageModel (give or take a few) sortable
        enum: ["Name", "updatedAt"],
      },
      order: {
        type: "number",
        enum: Object.values(SortOrder),
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
        minimum: 0,
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
        minLength: 1,
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
        minimum: 0,
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
        minLength: 1,
      },
      pkg: {
        type: "string",
        minLength: 1,
      },
    },
  },
};

// TODO: make sure this schema is ok (required fields?)
const manualPackageUpdateSchema = {
  querystring: {
    type: "object",
    properties: {
      since: {
        type: "string",
      },
      sort: {
        until: "string",
      },
    },
  },
};

// TODO: move this somewhere else
enum ApiErrorType {
  VALIDATION_ERROR = "validation_error",
  GENERIC_CLIENT_ERROR = "generic_client_error",
  GENERIC_SERVER_ERROR = "generic_server_error",
}

interface IApiErrorResponse {
  error: {
    type: ApiErrorType;
    debug?: string;
    stack?: string;
  };
}

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.setErrorHandler(async (error, request, reply): Promise<IApiErrorResponse> => {
    const [debug, stack] = NODE_ENV === "dev" ? [error.message, error.stack] : [];

    if (error.validation != null) {
      return {
        error: {
          type: ApiErrorType.VALIDATION_ERROR,
          debug,
          stack,
        },
      };
    }

    if (reply.res.statusCode.toString().startsWith("4")) {
      return {
        error: {
          type: ApiErrorType.GENERIC_CLIENT_ERROR,
          debug,
          stack,
        },
      };
    }

    return {
      error: {
        type: ApiErrorType.GENERIC_SERVER_ERROR,
        debug,
        stack,
      },
    };
  });

  fastify.register(ratelimit, {
    nonce: "yes",
  });

  // TODO: were cheking the header shit in a filthy way rn, make an auth middleware or something
  // *----------------- import package update --------------------
  fastify.get("/ghs/import", { onRequest: validateApiToken }, async () => {
    const yamls = await ghService.initialPackageImport();

    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yamls.map(yaml => addOrUpdatePackage(yaml as any)),
    );

    return `imported ${yamls.length} packages at ${new Date().toISOString()}`;
  });

  // TODO: same as /ghs/import
  // *----------------- update package update --------------------
  fastify.get("/ghs/update", { onRequest: validateApiToken }, async () => {
    const updateYamls = await ghService.updatePackages();

    if (updateYamls.length > 0) {
      for (let i = 0; i < updateYamls.length; i += 1) {
        const pkg = updateYamls[i] as unknown as ManifestModel;

        // eslint-disable-next-line no-await-in-loop
        await addOrUpdatePackage(pkg);
      }
    }

    return `${updateYamls.length} updated at ${new Date().toISOString()}`;
  });

  // *----------------- manual package import---------------------
  fastify.post("/ghs/manualImport", { onRequest: validateApiToken }, async request => {
    const manifests = request.body.manifests as string[];

    const yamls = await ghService.manualPackageImport(manifests);

    await Promise.all(
      yamls.map(yaml => {
        const pkg = yaml as unknown as ManifestModel;

        return addOrUpdatePackage(pkg);
      }),
    );

    return `imported ${yamls.length} packages at ${new Date().toISOString()}`;
  });

  // *----------------- manual package update---------------------
  fastify.get("/ghs/manualUpdate", { schema: manualPackageUpdateSchema, onRequest: validateApiToken }, async request => {
    const { since, until } = request.query;
    const updatedYamls = await ghService.manualPackageUpdate(since, until);

    if (updatedYamls.length > 0) {
      for (let i = 0; i < updatedYamls.length; i += 1) {
        const pkg = updatedYamls[i] as unknown as ManifestModel;

        // eslint-disable-next-line no-await-in-loop
        await addOrUpdatePackage(pkg);
      }
    }

    return `updated ${updatedYamls.length} packages at ${new Date().toISOString()}`;
  });

  // *----------------- single package import ---------------------
  fastify.post("/ghs/singleImport", { onRequest: validateApiToken }, async request => {
    const manifestPath = request.body.manifestPath as string;
    const yaml = await ghService.importSinglePackage(manifestPath);

    if (yaml == null || yaml === "") {
      return "error no yaml found";
    }

    const pkg = yaml as unknown as ManifestModel;

    const result = { insertedCount: 1 };
    await addOrUpdatePackage(pkg);

    return `insertted ${result.insertedCount} with ID - ${pkg.Id}`;
  });

  // *----------------- override package image ---------------------
  fastify.post("/ghs/imageOverride", { onRequest: validateApiToken }, async request => {
    const { pkgId, iconUrl } = request.body;

    // not optimised but here we are (will fix later, i rly will)
    const result = { modifiedCount: 1 };
    await rebuildPackage(pkgId, {
      IconUrl: iconUrl,
    });

    return `updated ${result.modifiedCount} iconUrl at ${new Date().toISOString()} for ID - ${pkgId}`;
  });

  // *-----------------  auto complete ---------------------
  fastify.get("/autocomplete", { schema: autocompleteSchema }, async request => {
    const { query } = request.query;

    const manifestService = new ManifestService();
    const packages = await manifestService.findAutocomplete(query, DEFAULT_AUTOCOMPLETE_SIZE);

    return {
      packages,
    };
  });

  // TODO: cache a search for everything response as its probs expensive af (optimise in some way anyway)
  // TODO: could also make a seperate route which optimises a list all packages type thing
  fastify.get("/search", { schema: searchSchema }, async request => {
    const {
      name,
      sort = "Name",
      order = SortOrder.ASCENDING,
      limit = DEFAULT_PAGE_SIZE,
      page = 0,
    } = request.query;

    const manifestService = new ManifestService();
    const [packages, total] = await manifestService.findByName(name, limit, page, sort, order);

    return {
      packages,
      total,
    };
  });

  // TODO: make it so the filters field is not required
  fastify.get("/list", async () => {
    const packageService = new PackageService();

    // TODO: cant deselect _id, maybe add that opt to the service (thats why theres a map at the end rn)
    // Note: keeping the date field called 'updatedAt' instead of UpdatedAt for backwards compat
    const list = (await packageService.find({
      filters: {},
      select: [
        "Id",
        "UpdatedAt",
      ],
    })).map(e => ({ Id: e.Id, updatedAt: e.UpdatedAt }));

    return {
      list,
    };
  });

  fastify.get("/:org", { schema: orgSchema }, async request => {
    const { org } = request.params;
    const { page = 0, limit = DEFAULT_PAGE_SIZE } = request.query;

    const manifestService = new ManifestService();
    const [packages, total] = await manifestService.findByOrg(org, limit, page);

    return {
      packages,
      total,
    };
  });

  fastify.get("/:org/:pkg", { schema: orgPkgSchema }, async request => {
    const { org, pkg } = request.params;

    const manifestService = new ManifestService();
    const orgPkg = await manifestService.findByPackage(org, pkg);

    return {
      package: orgPkg,
    };
  });
};
