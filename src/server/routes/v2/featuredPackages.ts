import { FastifyInstance } from "fastify";
import { PackageService } from "../../../database";

const updateFeaturedSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
        minLength: 3,
      },
    },
  },
  body: {
    type: "object",
    required: ["Banner", "Logo"],
    properties: {
      Banner: {
        type: "string",
        minLength: 5,
      },
      Logo: {
        type: "string",
        minLength: 5,
      },
    },
  },
};

const deleteFeaturedSchema = {
  params: {
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

const { API_ACCESS_TOKEN } = process.env;

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
  fastify.post("/:id", { schema: updateFeaturedSchema }, async (req, res) => {
    const accessToken = req.headers["xxx-access-token"];
    if (accessToken == null) {
      res.status(401);
      throw new Error("unauthorised");
    }
    if (accessToken !== API_ACCESS_TOKEN) {
      res.status(403);
      throw new Error("forbidden");
    }

    const { id } = req.params;
    const { Banner, Logo } = req.body;
    const pkg = await packageService.findOne({ filters: { Id: id } });

    if (pkg != null) {
      pkg.Featured = true;
      pkg.Banner = Banner;
      pkg.Logo = Logo;

      await packageService.upsertPackage(pkg);
      return {
        Message: "updated featured package details",
      };
    }

    res.code(404);
    throw new Error("failed to update featured package details, may not exist");
  });

  //* delete featured packaged (clear image, set to false)
  fastify.delete("/:id", { schema: deleteFeaturedSchema }, async (req, res) => {
    const accessToken = req.headers["xxx-access-token"];
    if (accessToken == null) {
      res.status(401);
      throw new Error("unauthorised");
    }
    if (accessToken !== API_ACCESS_TOKEN) {
      res.status(403);
      throw new Error("forbidden");
    }

    const { id } = req.params;
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
    throw new Error(
      "failed to delete featured package details, package may not exist",
    );
  });
};
