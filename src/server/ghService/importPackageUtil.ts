import fetch from "node-fetch";

import * as jsYaml from "js-yaml";
import { ManifestFolderList } from "./types/import/manifestFolderListModel";

const {
  GITHUB_TOKEN,
} = process.env;

const CONTENTS_BASE_URL = "https://api.github.com/repos/microsoft/winget-pkgs/contents";
// const COMMITS_BASE_URL =
// "https://api.github.com/repos/microsoft/winget-pkgs/commits?ref=master";

//! only call for initial import
// const getManifestFolderPaths = async (): Promise<string[]> => {
//   const manifestFolderList: Promise<ManifestFolderList[]> = await fetch(
//     `${CONTENTS_BASE_URL}/manifests`, {
//       headers: {
//         Authorization: `token ${GITHUB_TOKEN}`,
//       },
//     }
//   ).then((res) => res.json());

//   const manifestFolderPaths = await (await manifestFolderList).map(
//     (x) => x.path
//   );

//   return manifestFolderPaths;
// };

const getPackageFolderPaths = async (): Promise<string[]> => {
  //! only use for inital bulk import
  // const manifestFolderPaths = await getManifestFolderPaths();

  const manifestFolderPaths = [
    "manifests/7Zip",
    "manifests/Adobe",
    "manifests/Microsoft",
    "manifests/Discord",
    "manifests/vim",
    "manifests/Zoom",
    "manifests/Anki",
  ];
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

const getPackageDownloadUrls = async (): Promise<string[]> => {
  const packageFolderPaths = await getPackageFolderPaths();

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

  return downloadUrls;
};

const getPackageYamls = async (): Promise<string[]> => {
  const downloadUrls = await (await getPackageDownloadUrls()).filter(x => x != null);

  console.log(downloadUrls);

  const packageYamls = Promise.all(
    downloadUrls.map((url) => fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    })
      .then((res) => res.text())
      .then((txt) => jsYaml.safeLoad(txt))),
  );

  return packageYamls;
};

export = {
  getPackageYamls,
};
