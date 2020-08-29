import fs from "fs";
import path from "path";

import { DoubleMetaphone, NGrams, TfIdf } from "natural";

import NodeCache from "node-cache";

import { ManifestService, PackageService } from "../service";
import {
  IManifest,
  IBaseInsert,
  IBaseUpdate,
  IPackage,
} from "../types";

const {
  NODE_PATH,
} = process.env;

const NGRAM_MIN = 2;

const TFIDF_SAMPLE_CACHE_SEC = 30;
const TFIDF_SAMPLE_NAME = "desc_sample";
const TFIDF_SAMPLE_FP = path.join(NODE_PATH, "assets", `${TFIDF_SAMPLE_NAME}.json`);

const cache = new NodeCache();

// ye theres gonna be longer versions with random characters but those are technically
// against spec and should break anything sooooo...
const padSemver = (version: string): string => version.split(".").map(e => e.padStart(5, "0")).join(".");

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

const generateMetaphones = (word: string): string[] => {
  const metaphones = DoubleMetaphone.process(word);
  if (metaphones[0] === metaphones[1]) {
    return metaphones.slice(1);
  }

  return metaphones;
};

const generateNGrams = (word: string, min: number): string[] => {
  const ngrams = [];

  const encodings = generateMetaphones(word);
  ngrams.push([encodings]);

  for (let i = 0; i < encodings.length; i += 1) {
    if (encodings[i].length === Math.max(1, min)) {
      // TODO: if both encodings will always be the same length, remove this line
      // see this would be redundant cos im already adding the encodings a couple lines up
      // BUT idk if one encoding can be longer than other so ill leave it like this for now
      ngrams.push([[encodings[i]]]);
    } else {
      for (let j = min; j < encodings[i].length; j += 1) {
        ngrams.push(NGrams.ngrams(encodings[i].split(""), j));
      }
    }
  }

  return ngrams.flat().map(e => e.reduce((a, c) => a + c, "")).filter((e, i, a) => i === a.findIndex(f => e === f)).map(e => e.padEnd(3, "_"));
};

const generateStartNGrams = (word: string, min: number): string[] => {
  const ngrams = [];

  const encodings = generateMetaphones(word);

  for (let i = 0; i < encodings.length; i += 1) {
    if (encodings[i].length === Math.max(1, min)) {
      // TODO: if both encodings will always be the same length, remove this line
      // see this would be redundant cos im already adding the encodings a couple lines up
      // BUT idk if one encoding can be longer than other so ill leave it like this for now
      ngrams.push(encodings[i]);
    } else {
      for (let j = min; j <= encodings[i].length; j += 1) {
        ngrams.push(encodings[i].slice(0, j));
      }
    }
  }

  return ngrams.filter((e, i, a) => i === a.findIndex(f => e === f)).map(e => e.padEnd(3, "_"));
};

const extractKeywords = (text: string, max?: number): string[] => {
  let tfidf: TfIdf;

  const cachedTfidfData: string | undefined = cache.get(TFIDF_SAMPLE_NAME);
  if (cachedTfidfData == null) {
    const descSample: string[] = JSON.parse(fs.readFileSync(TFIDF_SAMPLE_FP).toString());

    tfidf = new TfIdf();
    descSample.forEach(e => tfidf.addDocument(e));

    cache.set(TFIDF_SAMPLE_NAME, JSON.stringify(tfidf), TFIDF_SAMPLE_CACHE_SEC);
  } else {
    tfidf = new TfIdf(JSON.parse(cachedTfidfData));
  }

  tfidf.addDocument(text);
  // it does exist, the types are just fucked as usual
  // TODO: can probs set to unknown and run some validation on this
  const keywords = tfidf.listTerms((tfidf as any).documents.length - 1);

  return keywords.slice(0, max ?? keywords.length).map(e => e.term);
};

// NOTE: pkg are any additional fields that should be updated or overwritten on the package doc
const rebuildPackage = async (id: string, pkg: IBaseUpdate<IPackage> = {}): Promise<void> => {
  const manifestService = new ManifestService();
  const packageService = new PackageService();

  // TODO: optimisation, dont fetch every manifest for a package every
  // single time (can get unweildy when more versions are added)
  const manifests = await manifestService.find({
    filters: {
      Id: id,
    },
  });

  if (manifests.length === 0) {
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

  const descriptionNGrams = latestManifest.Description == null
    ? []
    : extractKeywords(latestManifest.Description, 10)
      .map(e => generateNGrams(e, 2))
      .flat()
      .filter((e, i, a) => i === a.findIndex(f => e === f));

  const newPkg = {
    Id: latestManifest.Id,

    Versions: versions,
    Latest: {
      Name: latestManifest.Name,
      Publisher: latestManifest.Publisher,
      Tags: tags,
      Description: latestManifest.Description,
      Homepage: latestManifest.Homepage,
      License: latestManifest.License,
      LicenseUrl: latestManifest.LicenseUrl,
    },

    Featured: false,

    Search: {
      Name: generateNGrams(latestManifest.Name, NGRAM_MIN).join(" "),
      Publisher: generateNGrams(latestManifest.Publisher, NGRAM_MIN).join(" "),
      Tags: tagNGrams.length === 0 ? undefined : tagNGrams.join(" "),
      Description: descriptionNGrams.length === 0 ? undefined : descriptionNGrams.join(" "),
    },

    UpdatedAt: new Date(),
    CreatedAt: new Date(),

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
  generateStartNGrams,
  generateMetaphones,
  extractKeywords,
};
