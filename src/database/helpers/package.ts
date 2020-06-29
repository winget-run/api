import { IManifest, IBaseInsert } from "../types";
import { ManifestService, PackageService } from "../service";

const manifestService = new ManifestService();
const packageService = new PackageService();

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

const rebuildPackage = async (id: string): Promise<void> => {
  const manifests = await manifestService.find({
    filters: {
      Id: id,
    },
  });

  // get fields from latest
  // get version list
  // get sortable version field
  const versions = manifests.map(e => e.Version).sort(sortSemver);
  const latestPad = padSemver(versions[0]);

  
};

// NOTE: additions are made synchronously as data integrity is more important than speed here

// NOTE: for simplicity, a package is completely re-added/updated after a corresponding manifest change
// this 1. isnt a big issue cos reads >>> writes, and 2. manifest errors can be easily fixed
const addOrUpdatePackage = async (manifest: IBaseInsert<IManifest>): Promise<void> => {
  const { Id: id } = manifest;

  if (id == null) {
    throw new Error("id not set");
  }

  await manifestService.upsertManifest(manifest);
  await rebuildPackage(id);
};

const removePackage = async (id: string, version: string): Promise<void> => {
  await manifestService.removeManifestVersion(id, version);
  await rebuildPackage(id);
};

export {
  addOrUpdatePackage,
  removePackage,
};
