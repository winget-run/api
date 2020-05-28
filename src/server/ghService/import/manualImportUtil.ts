import { TextDecoder } from "util";

import fetch from "node-fetch";

import * as jsYaml from "js-yaml";
import { ManifestFolderList } from "../types/import/manifestFolderListModel";


const {
  GITHUB_TOKEN,
} = process.env;

const CONTENTS_BASE_URL = "https://api.github.com/repos/microsoft/winget-pkgs/contents";

// to handle people who can't follwo the docs, not pointing any fingers => MongoDB
const handleThreeLevelFolders = async (manifest: ManifestFolderList): Promise<string> => {
  const downloadUrlPath: ManifestFolderList[] = await fetch(`${CONTENTS_BASE_URL}/${manifest.path}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  }).then(res => res.json());

  const downloadUrl: string = downloadUrlPath[0].download_url;
  console.log(`${downloadUrl} - DL`);

  return downloadUrl;
};

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


const getPackageDownloadUrls = async (manifests: string[]): Promise<string[]> => {
  const packageFolderPaths = await getPackageFolderPaths(manifests);

  const downloadUrlPaths: ManifestFolderList[] = await Promise.all(
    packageFolderPaths.map((path) => fetch(`${CONTENTS_BASE_URL}/${path}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    }).then((res) => res.json())),
  );

  const flatDownloadUrls: ManifestFolderList[] = downloadUrlPaths.flat(downloadUrlPaths.length);

  const downloadUrls: string[] = [];

  // check if it has three levels
  flatDownloadUrls.forEach(async element => {
    // eslint-disable-next-line no-empty
    if (element.download_url == null) {
      const url = await handleThreeLevelFolders(element);
      console.log(`${url} - DL`);
      downloadUrls.push(url);
    } else {
      downloadUrls.push(element.download_url);
    }
  });

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
      .then(res => res.arrayBuffer())
      .then(buffer => {
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

        return res;
      })),
  );

  return packageYamls;
};

export = {
  getPackageDownloadUrls,
};
