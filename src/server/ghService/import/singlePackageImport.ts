import fetch from "node-fetch";

import { ManifestFolderList } from "../types/import/manifestFolderListModel";

const {
  GITHUB_TOKEN,
} = process.env;

const BASE_URL = "https://api.github.com/repositories/197275551/contents";

const getPackageDownloadUrl = async (manifestPath: string): Promise<string> => {
  const downloadUrlPath: Promise<ManifestFolderList> = await fetch(`${BASE_URL}/${manifestPath}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  }).then(res => res.json());

  const downloadUrl = (await downloadUrlPath).download_url;

  return downloadUrl;
};

const getManifest = async(downloadUrl: string) => {

};
