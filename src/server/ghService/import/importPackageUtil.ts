import fetch from "node-fetch";
import { BatchImport, Item } from "../types/import/batchImportModel";

import { parsePackageYaml } from "../helpers/decodingHelper";

const {
  GITHUB_TOKEN,
} = process.env;

const BASE_URL = "https://api.github.com/search/code?q=extension:yaml+repo:microsoft/winget-pkgs+path:/manifests";
const TAKE = 100;

const getPageCount = async (): Promise<number> => {
  const model: BatchImport = await fetch(`${BASE_URL}&page=0&per_page=1`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  }).then(res => res.json());
  const totalCount = model.total_count;
  const pageCount = Math.ceil(totalCount / TAKE);

  return pageCount;
};

const getPackgeUrls = async (): Promise<string[]> => {
  // set page count
  const pageCount = await getPageCount();

  let yamlUrls: string[] = [];

  for (let page = 1; page <= pageCount; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const model: BatchImport = await fetch(`${BASE_URL}&page=${page}&per_page=${TAKE}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    })
      .then(res => res.json());

    const items: Item[] = model.items.map(item => item);
    const urls = items.map(x => x.url);

    yamlUrls = [...yamlUrls, ...urls];
  }

  return yamlUrls;
};

const getPackageYamls = async (): Promise<string[]> => {
  const packageUrls = await getPackgeUrls();

  const packageYamls = Promise.all(
    packageUrls.map((url) => fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw",
      },
    })
      .then(res => res.buffer())
      .then(buf => {
        const res = parsePackageYaml(buf);

        return res;
      })),
  );


  return packageYamls;
};

export = {
  getPackageYamls,
}
