import { FastifyInstance } from "fastify";
import { ManifestService } from "../../../database";

const manifestSchema = {
  params: {
    type: "object",
    required: ["id", "version"],
    properties: {
      id: {
        type: "string",
        // a.b
        minLength: 3,
      },
      version: {
        type: "string",
        minLength: 1,
      },
    },
  },
};

export default async (fastify: FastifyInstance): Promise<void> => {
  const manifestService = new ManifestService();

  fastify.get("/:id/:version", { schema: manifestSchema }, async (request, response) => {
    const { id, version } = request.params;

    if (id == null || version == null) {
      response.code(404);
      throw new Error("id  or version not specified, please do that");
    }

    const manifest = await manifestService.findManifestVersion(id, version);
    if (manifest == null) {
      response.code(404);
      throw new Error("manifest not found");
    }

    return {
      Manifest: manifest,
    };
  });
};
