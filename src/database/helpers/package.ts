import { DoubleMetaphone, NGrams } from "natural";

import { ManifestService, PackageService } from "../service";
import {
  IManifest,
  IBaseInsert,
  IBaseUpdate,
  IPackage,
} from "../types";

const NGRAM_MIN = 2;

// ye theres gonna be longer versions with random characters but those are technically
// against spec and should break anything sooooo...
const padSemver = (version: string): string => version.split(".").map(e => e.padEnd(5, "0")).join(".");

enum SortDirection {
  Ascending = 1,
  Descending = -1,
}

const createSortSemver = (direction: SortDirection) => (a: string, b: string): number => {
  const aPad = padSemver(a);
  const bPad = padSemver(b);

  if (aPad > bPad) {
    return direction;
  }

  if (aPad < bPad) {
    return -direction;
  }

  return 0;
};

// TODO: remove (dead code?)
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

const generateNGrams = (word: string, min: number): string[] => {
  const ngrams = [];

  const encodings = DoubleMetaphone.process(word);
  if (encodings[0] === encodings[1]) {
    encodings.pop();
  }

  for (let i = 0; i < encodings.length; i += 1) {
    if (encodings[i].length === Math.max(1, min)) {
      ngrams.push([[encodings[i]]]);
    } else {
      for (let j = min; j < encodings[i].length; j += 1) {
        ngrams.push(NGrams.ngrams(encodings[i].split(""), j));
      }
    }
  }

  return ngrams.flat().map(e => e.reduce((a, c) => a + c, "")).filter((e, i, a) => i === a.findIndex(f => e === f));
};

// NOTE: pkg are any additional fields that should be updated or overwritten on the package doc
const rebuildPackage = async (id: string, pkg: IBaseUpdate<IPackage> = {}): Promise<void> => {
  const manifestService = new ManifestService();
  const packageService = new PackageService();

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

  // TODO: just sort the manifests array instead

  // get fields from latest
  // get version list
  // get sortable version field
  const versions = manifests.map(e => e.Version).sort(createSortSemver(SortDirection.Descending));
  const latestVersion = versions[0];
  // doing a manifests.length check a few lines up
  const latestManifest = manifests.find(e => e.Version === latestVersion) as IManifest;
  //

  const tags = latestManifest.Tags == null ? [] : latestManifest.Tags.split(",").map(e => e.trim().toLowerCase());

  // search shite
  const tagNGrams = tags.map(e => generateNGrams(e, NGRAM_MIN)).flat().filter((e, i, a) => i === a.findIndex(f => e === f));

  // optimisations:
  // - remove short words
  // - only make start of word ngrams
  // - ...or dont make ngrams at all?
  // - set max description words/length?
  // - some way of picking out key words

  // TODO: also adjust field weights again
  // const descriptionNGrams = latestManifest.Description == null ? [] : generateNGrams(latestManifest.Description, NGRAM_MIN);

  const newPkg = {
    Id: latestManifest.Id,

    Versions: versions,
    Latest: {
      Name: latestManifest.Name,
      Publisher: latestManifest.Publisher,
      Tags: tags,
      Description: latestManifest.Description,
      License: latestManifest.License,
    },

    Featured: false,

    NGrams: {
      Name: generateNGrams(latestManifest.Name, NGRAM_MIN).join(" "),
      Publisher: generateNGrams(latestManifest.Publisher, NGRAM_MIN).join(" "),
      Tags: tagNGrams.length === 0 ? undefined : tagNGrams.join(" "),
      // Description: descriptionNGrams.length === 0 ? undefined : descriptionNGrams.join(" "),
    },

    UpdatedAt: new Date(),

    ...pkg,
  };

  packageService.upsertPackage(newPkg);
};

// NOTE: additions are made synchronously as data integrity is more important than speed here

// NOTE: for simplicity, a package is completely re-added/updated after a corresponding manifest change
// this 1. isnt a big issue cos reads >>> writes, and 2. manifest errors can be easily fixed
const addOrUpdatePackage = async (manifest: IBaseInsert<IManifest>, pkg: IBaseUpdate<IPackage> = {}): Promise<void> => {
  const manifestService = new ManifestService();

  const { Id: id } = manifest;

  if (id == null) {
    throw new Error("id not set");
  }

  await manifestService.upsertManifest(manifest);
  await rebuildPackage(id, pkg);
};

const removePackage = async (id: string, version: string, pkg: IBaseUpdate<IPackage> = {}): Promise<void> => {
  const manifestService = new ManifestService();

  await manifestService.removeManifestVersion(id, version);
  await rebuildPackage(id, pkg);
};

export {
  padSemver,
  sortSemver,
  rebuildPackage,
  addOrUpdatePackage,
  removePackage,
  generateNGrams,
};
