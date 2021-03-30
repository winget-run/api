import { TextDecoder } from "util";

import fetch from "node-fetch";

import * as jsYaml from "js-yaml";
import { ManifestFolderList } from "../types/import/manifestFolderListModel";

const { GITHUB_TOKEN } = process.env;

const CONTENTS_BASE_URL = "https://api.github.com/repos/microsoft/winget-pkgs/contents";

// TODO actually check it works
const getMPaths = async (): Promise<string[]> => {
  const mFolderPaths: Promise<ManifestFolderList[]> = await fetch(
    `${CONTENTS_BASE_URL}/manifests`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    },
  ).then((res) => res.json());

  const mpaths = (await mFolderPaths).map((x) => x.path);

  return mpaths;
};

// TODO actually check it works
const getManifestFolderPaths = async (): Promise<string[]> => {
  const mPaths = await getMPaths();
  const manifestFolderList: ManifestFolderList[] = [];

  for (let i = 0; i < mPaths.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const manifestFolder = await fetch(`${CONTENTS_BASE_URL}/${mPaths[i]}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    }).then((res) => res.json());

    manifestFolderList.push(manifestFolder);
  }

  const manifestFolderPaths = (await manifestFolderList).map((x) => x.path);

  return manifestFolderPaths;
};

const getPackageFolderPaths = async (): Promise<string[]> => {
  const manifestFolderPaths = await getManifestFolderPaths();

  const packageFolders: ManifestFolderList[] = [];
  for (let i = 0; i < manifestFolderPaths.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const packageFolder = await fetch(
      `${CONTENTS_BASE_URL}/${manifestFolderPaths[i]}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      },
    ).then((res) => res.json());

    console.log(packageFolder);
    packageFolders.push(packageFolder);
  }

  const flatPackageFolderPaths: ManifestFolderList[] = packageFolders.flat(
    packageFolders.length,
  );
  const packageFolderPaths = flatPackageFolderPaths.map((x) => x.path);

  return packageFolderPaths;
};

// for people like mongo who cant read the docs
const handleThreeLevelDeep = async (path: string): Promise<string> => {
  const downloadUrlPath: ManifestFolderList[] = await fetch(
    `${CONTENTS_BASE_URL}/${path}`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    },
  ).then((res) => res.json());

  const downloadUrl = downloadUrlPath[0].download_url;

  return downloadUrl;
};

const getPackageDownloadUrls = async (): Promise<string[]> => {
  const packageFolderPaths = await getPackageFolderPaths();

  const downloadUrlPaths: ManifestFolderList[] = [];
  for (let i = 0; i < packageFolderPaths.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const downloadUrlPath = await fetch(
      `${CONTENTS_BASE_URL}/${packageFolderPaths[i]}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      },
    ).then((res) => res.json());

    console.log(downloadUrlPath);
    downloadUrlPaths.push(downloadUrlPath);
  }

  const flatDownloadUrls: ManifestFolderList[] = downloadUrlPaths.flat(
    downloadUrlPaths.length,
  );

  const downloadUrls: string[] = [];
  // check if it has three levels
  for (let i = 0; i < flatDownloadUrls.length; i += 1) {
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

const getPackageYamls = async (): Promise<string[]> => {
  const downloadUrls = await (await getPackageDownloadUrls()).filter(
    (x) => x != null,
  );

  const packageYamls: string[] = [];
  for (let i = 0; i < downloadUrls.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const packageYaml = await fetch(downloadUrls[i], {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    })
      .then((res) => res.buffer())
      .then((buffer) => {
        const utf8decoder = new TextDecoder("utf-8");
        const utf16decoder = new TextDecoder("utf-16");

        let res;
        try {
          const text = utf8decoder.decode(buffer);
          res = jsYaml.safeLoad(text);
        } catch (error) {
          const text = utf16decoder.decode(buffer);
          res = jsYaml.safeLoad(text);
        }

        res.Version = String(res.Version);
        return res;
      });

    console.log(packageYaml);
    packageYamls.push(packageYaml);
  }

  return packageYamls;
};

export = {
  getPackageYamls,
};
