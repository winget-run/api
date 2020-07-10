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

  fastify.get("/:id/:version", { schema: manifestSchema }, async request => {
    const { id, version } = request.params;

    const manifest = await manifestService.findManifestVersion(id, version);

    return {
      Manifest: manifest,
    };
  });
};
