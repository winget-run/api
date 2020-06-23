import fetch from "node-fetch";
import { TextDecoder } from "util";
import * as jsYaml from "js-yaml";

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

const getPackageYaml = async (manifestPath: string): Promise<string> => {
  const downloadUrl = await getPackageDownloadUrl(manifestPath);

  const packageYaml = await fetch(downloadUrl)
    .then(res => res.buffer())
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
    });

  return packageYaml;
};

export = {
  getPackageYaml,
};
