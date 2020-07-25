import { FastifyInstance } from "fastify";
import { PackageService } from "../../../database";

export default async (fastify: FastifyInstance): Promise<void> => {
  const packageService = new PackageService();

  const updateFeaturedSchema = {
    body: {
      type: "object",
      required: ["id", "banner", "logo"],
      properties: {
        id: {
          type: "string",
          minLength: 1,
        },
        banner: {
          type: "string",
          minLength: 1,
        },
        logo: {
          type: "string",
          minLength: 1,
        },
      },
    },
  };

  const deleteFeaturedSchema = {
    querystring: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          minLength: 1,
        },
      },
    },
  };

  //* get featured packages
  fastify.get("/", async () => {
    const featuredPackages = await packageService.find({
      filters: { Featured: true },
    });

    return featuredPackages;
  });

  //* update featured package
  fastify.post("/", { schema: updateFeaturedSchema }, async (req, res) => {
    const { id, banner, logo } = req.body;
    const pkg = await packageService.findOne({ filters: { Id: id } });

    if (pkg != null) {
      pkg.Featured = true;
      pkg.Banner = banner;
      pkg.Logo = logo;

      await packageService.upsertPackage(pkg);
      return res.code(200).send("updated featured package details");
    }

    return res.code(500).send("failed to update featured package details");
  });

  //* delete featured packaged (clear image, set to false)
  fastify.delete("/", { schema: deleteFeaturedSchema }, async (req, res) => {
    const { id } = req.query;
    const pkg = await packageService.findOne({ filters: { Id: id } });

    if (pkg != null) {
      pkg.Featured = false;
      pkg.Banner = "";
      pkg.Logo = "";

      await packageService.upsertPackage(pkg);
      return res.code(200).send("deleted featured package details");
    }

    return res.code(500).send("failed to delete featured package details");
  });
};
