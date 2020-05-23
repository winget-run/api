import fetch from "node-fetch";

import * as jsYaml from "js-yaml";
import { ManifestFolderList } from "./types/import/manifestFolderListModel";

const CONTENTS_BASE_URL =
  "https://api.github.com/repos/microsoft/winget-pkgs/contents";
const COMMITS_BASE_URL =
  "https://api.github.com/repos/microsoft/winget-pkgs/commits?ref=master";

//! only call for initial import
const getManifestFolderPaths = async (): Promise<String[]> => {
  const manifestFolderList: Promise<ManifestFolderList[]> = await fetch(
    `${CONTENTS_BASE_URL}/manifests`
  ).then((res) => res.json());

  const manifestFolderPaths = manifestFolderList.then((folder) =>
    folder.map((x) => x.path)
  );

  return manifestFolderPaths;
};

const getPackageFolderPaths = async (): Promise<String[]> => {
  //! only use for inital bulk import
  //const manifestFolderPaths = await getManifestFolderPaths();

  const manifestFolderPaths = ["manifests/7Zip", "manifests/Adobe"];
  const packageFolders: ManifestFolderList[] = await Promise.all(
    manifestFolderPaths.map((path) =>
      fetch(`${CONTENTS_BASE_URL}/${path}`).then((res) => res.json())
    )
  );

  const packageFolderPaths = packageFolders.map((folder) => folder.path);

  return packageFolderPaths;
};

const getPackageDownloadUrls = async (): Promise<string[]> => {
  const packageFolderPaths = await getPackageFolderPaths();

  const flatPackageFolderPaths: ManifestFolderList[] = packageFolderPaths.flat(
    packageFolderPaths.length
  );
  const repoPaths = flatPackageFolderPaths.map((x) => x.path);

  const downloadUrls: ManifestFolderList[] = await Promise.all(
    repoPaths.map((path) =>
      fetch(`${CONTENTS_BASE_URL}/${path}`).then((res) => res.json())
    )
  );

  const flatRawUrls: ManifestFolderList[] = downloadUrls.flat(
    downloadUrls.length
  );

  const rawUrls: string[] = flatRawUrls.map((x) => x.download_url);

  return rawUrls;
};

const getPackageYamls = async (): Promise<string[]> => {
  const rawUrls = await getPackageDownloadUrls();

  const packageYamls = Promise.all(
    rawUrls.map((url) =>
      fetch(url)
        .then((res) => res.text())
        .then((txt) => jsYaml.safeLoad(txt))
    )
  );

  return packageYamls;
};

export = {
  getPackageYamls,
};
