import fs from "fs";
import path from "path";

import { createConnection } from "typeorm";

import { PackageModel, ManifestModel, StatsModel } from "./model";
import { PackageService, ManifestService, StatsService } from "./service";
import {
  IPackage,
  IManifest,
  StatsResolution,
  IStats,
} from "./types";
import {
  padSemver,
  sortSemver,
  rebuildPackage,
  addOrUpdatePackage,
  removePackage,
} from "./helpers";

// patch the typeorm MongoDriver to support mongo 3.6+ tls options
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MongoDriver = require("typeorm/driver/mongodb/MongoDriver");

const originalFunc = MongoDriver.MongoDriver.prototype.buildConnectionOptions;
// eslint-disable-next-line func-names
MongoDriver.MongoDriver.prototype.buildConnectionOptions = function (): object {
  const mongoOptions = {
    ...originalFunc.apply(this),
    ...this.options.extra,
  };

  return mongoOptions;
};

const CA_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt";

const {
  NODE_ENV,
  NODE_PATH,
  MONGO_HOST,
  MONGO_DB,
  MONGO_CERT,
} = process.env;

const connect = async (): Promise<void> => {
  const certPath = path.join(NODE_PATH, "mongo-cert.pem");
  fs.writeFileSync(certPath, MONGO_CERT);

  const envOptions = {
    ...(NODE_ENV === "dev" ? { tlsAllowInvalidCertificates: true } : {}),
    ...(NODE_ENV === "prod" ? { tlsCAFile: CA_PATH } : {}),
  };

  await createConnection({
    type: "mongodb",
    // needs to be set in the url, if we try to set the 'database' field, it tries to connect to a 'test' db...
    url: `mongodb://${MONGO_HOST}/${MONGO_DB}`,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authMechanism: "MONGODB-X509",
    authSource: "$external",

    // requires a patch to work with mongo 3.6+ features (tls)
    extra: {
      tls: true,
      tlsCertificateKeyFile: certPath,

      ...envOptions,
    },

    entities: [
      PackageModel,
      ManifestModel,
      StatsModel,
    ],
  });

  // ensure appropriate indexes (since the typeorm way to do it is broke)
  const manifestService = new ManifestService();
  manifestService.setupIndices();

  const packageService = new PackageService();
  packageService.setupIndices();

  console.log(`connected to mongo; ${MONGO_HOST}/${MONGO_DB}`);
};

export {
  connect,

  PackageModel,
  IPackage,
  PackageService,

  ManifestModel,
  IManifest,
  ManifestService,

  StatsModel,
  StatsResolution,
  IStats,
  StatsService,

  padSemver,
  sortSemver,
  rebuildPackage,
  addOrUpdatePackage,
  removePackage,
};
