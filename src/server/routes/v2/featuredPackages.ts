import { FastifyInstance } from "fastify";
import { PackageService } from "../../../database";

const updateFeaturedSchema = {
  body: {
    type: "object",
    required: ["id", "banner", "logo"],
    properties: {
      id: {
        type: "string",
        minLength: 3,
      },
      banner: {
        type: "string",
        minLength: 5,
      },
      logo: {
        type: "string",
        minLength: 5,
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
        minLength: 3,
      },
    },
  },
};

export default async (fastify: FastifyInstance): Promise<void> => {
  const packageService = new PackageService();

  //* get featured packages
  fastify.get("/", async () => {
    const featuredPackages = await packageService.find({
      filters: { Featured: true },
    });

    return {
      Packages: featuredPackages,
    };
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
      return {
        Message: "updated featured package details",
      };
    }

    res.code(404);
    throw new Error("failed to update featured package details, may not exist");
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
      return {
        Message: "deleted featured package details",
      };
    }

    res.code(404);
    throw new Error("failed to delete featured package details, package may not exist");
  });
};
