import fetch from "node-fetch";
import * as jsYaml from "js-yaml";
import { TextDecoder } from "util";

import { MasterCommit } from "../types/update/masterCommitModel";
import { CommitDetails, File } from "../types/update/commitDetailsModel";
import { PackageFileDetails } from "../types/update/packageFileDetailsModel";


const COMMITS_BASE_URL = "https://api.github.com/repos/microsoft/winget-pkgs/commits?ref=master";
const CONTENTS_BASE_URL = "https://api.github.com/repos/microsoft/winget-pkgs/contents";

const {
  GITHUB_TOKEN,
  UPDATE_FREQUENCY_MINUTES,
} = process.env;

const getCommitsMasterTimeRange = async (): Promise<string[]> => {
  // eslint-disable-next-line radix
  const frequency = parseInt(UPDATE_FREQUENCY_MINUTES);

  // ! use when in production
  const since = new Date(new Date().setMinutes(new Date().getMinutes() - frequency)).toISOString();
  const until = new Date().toISOString();


  const masterCommits: Promise<MasterCommit[]> = await fetch(
    `${COMMITS_BASE_URL}&&since=${since}&&until=${until}`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    },
  ).then((res) => res.json());

  const commitUrls = (await masterCommits).map((commit) => commit.url);

  return commitUrls;
};

const getUpdatedFilePaths = async (): Promise<string[]> => {
  const commitUrls = await getCommitsMasterTimeRange();

  const commitDetails: CommitDetails[] = await Promise.all(
    commitUrls.map((commitUrl) => fetch(commitUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    }).then((res) => res.json())),
  );

  const files = commitDetails.map((commitDetail) => commitDetail.files);
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const flatFiles: File[] = files.flat(files.length);
  const filePaths = flatFiles.map((file) => file.filename);

  return filePaths;
};

const getPackageDownloadUrls = async (): Promise<string[]> => {
  const updatedFilePaths = await (await getUpdatedFilePaths()).filter((x) => x.startsWith("manifests/"));

  const packageFileDetails: PackageFileDetails[] = await Promise.all(
    updatedFilePaths.map((path) => fetch(`${CONTENTS_BASE_URL}/${path}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    }).then((res) => res.json())),
  );

  const downloadUrls = packageFileDetails.map((pkg) => pkg.download_url);

  return downloadUrls;
};

const getUpdatedPackageYamls = async (): Promise<string[]> => {
  const downloadUrls = await (await getPackageDownloadUrls()).filter(
    (url) => url != null,
  );

  const updatePackageYamls = Promise.all(
    downloadUrls.map((url) => fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    })
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

        res.Version = String(res.Version);

        return res;
      })),
  );

  return updatePackageYamls;
};

export = { getUpdatedPackageYamls };
