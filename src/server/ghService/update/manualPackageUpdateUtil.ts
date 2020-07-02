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
} = process.env;

const getCommitsMasterTimeRange = async (since: Date, until: Date): Promise<string[]> => {
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

const getUpdatedFileFath = async (since: Date, until: Date): Promise<string[]> => {
  const commitUrls = await getCommitsMasterTimeRange(since, until);

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

const getPackageDownloadUrls = async (since: Date, until: Date): Promise<string[]> => {
  const updatedFilePaths = await (await getUpdatedFileFath(since, until)).filter((x) => x.startsWith("manifests/"));

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

const getUpdatedPackageYamls = async (since: Date, until: Date): Promise<string[]> => {
  const downloadUrls = await (await getPackageDownloadUrls(since, until)).filter(
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
