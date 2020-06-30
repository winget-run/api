import { ManifestService, PackageService } from "../service";
import {
  IManifest,
  IBaseInsert,
  IBaseUpdate,
  IPackage,
} from "../types";

const manifestService = new ManifestService();
const packageService = new PackageService();

// ye theres gonna be longer versions with random characters but those are technically
// against spec and should break anything sooooo...
const padSemver = (version: string): string => version.split(".").map(e => e.padEnd(5, "0")).join(".");

const sortSemver = (a: string, b: string): number => {
  const aPad = padSemver(a);
  const bPad = padSemver(b);

  if (aPad > bPad) {
    return 1;
  }
  if (aPad < bPad) {
    return -1;
  }

  return 0;
};

// NOTE: pkg are any additional fields that should be updated or overwritten on the package doc
const rebuildPackage = async (id: string, pkg: IBaseUpdate<IPackage>): Promise<void> => {
  const manifests = await manifestService.find({
    filters: {
      Id: id,
    },
  });

  if (manifests.length === 0) {
    // TODO: make Id unique in package model
    await packageService.deleteOne({
      Id: id,
    });

    return;
  }

  // get fields from latest
  // get version list
  // get sortable version field
  const versions = manifests.map(e => e.Version).sort(sortSemver);
  const latestVersion = versions[0];

  // doing a manifests.length check a few lines up
  const latestManifest = manifests.find(e => e.Version === latestVersion) as IManifest;

  const newPkg = {
    Id: latestManifest.Id,

    Versions: versions,
    Latest: {
      Name: latestManifest.Name,
      Publisher: latestManifest.Publisher,
      Description: latestManifest.Description,
      License: latestManifest.License,
    },

    PaddedVersion: padSemver(latestVersion),

    ...pkg,
  };

  packageService.upsertPackage(newPkg);
};

// NOTE: additions are made synchronously as data integrity is more important than speed here

// NOTE: for simplicity, a package is completely re-added/updated after a corresponding manifest change
// this 1. isnt a big issue cos reads >>> writes, and 2. manifest errors can be easily fixed
const addOrUpdatePackage = async (manifest: IBaseInsert<IManifest>, pkg: IBaseUpdate<IPackage>): Promise<void> => {
  const { Id: id } = manifest;

  if (id == null) {
    throw new Error("id not set");
  }

  await manifestService.upsertManifest(manifest);
  await rebuildPackage(id, pkg);
};

const removePackage = async (id: string, version: string, pkg: IBaseUpdate<IPackage>): Promise<void> => {
  await manifestService.removeManifestVersion(id, version);
  await rebuildPackage(id, pkg);
};

export {
  padSemver,
  sortSemver,
  rebuildPackage,
  addOrUpdatePackage,
  removePackage,
};