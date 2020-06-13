
import fetch from "node-fetch";
import parseYaml from "../helpers/decodingHelper";

import { ManifestFolderList } from "../types/import/manifestFolderListModel";

const {
  GITHUB_TOKEN,
} = process.env;

const CONTENTS_BASE_URL = "https://api.github.com/repos/microsoft/winget-pkgs/contents";

//! only call for initial import
const getManifestFolderPaths = async (manifests: string[]): Promise<string[]> => {
  const manifestFolderPaths = manifests;

  return manifestFolderPaths;
};

const getPackageFolderPaths = async (manifests: string[]): Promise<string[]> => {
  const manifestFolderPaths = await getManifestFolderPaths(manifests);

  const packageFolders: ManifestFolderList[] = await Promise.all(
    manifestFolderPaths.map((e) => fetch(`${CONTENTS_BASE_URL}/${e}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    }).then((res) => res.json())),
  );

  const flatPackageFolderPaths: ManifestFolderList[] = packageFolders.flat(
    packageFolders.length,
  );
  const packageFolderPaths = flatPackageFolderPaths.map((x) => x.path);

  return packageFolderPaths;
};

// for people like mongo who cant read the docs
const handleThreeLevelDeep = async (path: string): Promise<string> => {
  const downloadUrlPath: ManifestFolderList[] = await fetch(`${CONTENTS_BASE_URL}/${path}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  }).then(res => res.json());

  const downloadUrl = downloadUrlPath[0].download_url;

  return downloadUrl;
};


const getPackageDownloadUrls = async (manifests: string[]): Promise<string[]> => {
  const packageFolderPaths = await getPackageFolderPaths(manifests);

  const downloadUrlPaths: ManifestFolderList[] = await Promise.all(
    packageFolderPaths.map((path) => fetch(`${CONTENTS_BASE_URL}/${path}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    }).then((res) => res.json())),
  );

  const flatDownloadUrls: ManifestFolderList[] = downloadUrlPaths.flat(
    downloadUrlPaths.length,
  );

  const downloadUrls = flatDownloadUrls.map((url) => url.download_url);

  // check if it has three levels
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < flatDownloadUrls.length; i++) {
    if (flatDownloadUrls[i].download_url == null) {
      // eslint-disable-next-line no-await-in-loop
      const url: string = await handleThreeLevelDeep(flatDownloadUrls[i].path);
      downloadUrls.push(url);
    } else {
      downloadUrls.push(flatDownloadUrls[i].download_url);
    }
  }

  return downloadUrls;
};

const getPackageYamls = async (manifests: string[]): Promise<string[]> => {
  const downloadUrls = await (await getPackageDownloadUrls(manifests)).filter(x => x != null);

  const packageYamls = Promise.all(
    downloadUrls.map((url) => fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    })
      .then(res => res.buffer())
      .then(buf => {
        const res = parseYaml.parsePackageYaml(buf);

        return res;
      })),
  );

  return packageYamls;
};

export = {
  getPackageYamls,
};
