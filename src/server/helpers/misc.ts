/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import fs from "fs";
import path from "path";
import { TextDecoder } from "util";

import fetch from "node-fetch";
import encoding from "encoding-japanese";
import yaml from "js-yaml";

const {
  NODE_PATH,
  GITHUB_TOKEN,
} = process.env;

// converts encoding.js returned enocding to one understood by node
// need to handle utf-32, binary, unicode, and auto specially
const encodingTable = {
  UTF32: "utf-32",
  UTF16: "utf-16",
  UTF16BE: "utf-16be",
  UTF16LE: "utf-16le",
  BINARY: "binary",
  ASCII: "ascii",
  JIS: "iso-2022-jp",
  UTF8: "utf-8",
  EUCJP: "euc-jp",
  SJIS: "sjis",
  UNICODE: "unicode",
  // extra encoding.js type
  AUTO: "auto",
};

const loadAllPkgs = async () => {
  let packages: any[] = [];

  let counter = 1;
  let finished = false;
  while (!finished) {
    console.log(counter);

    // eslint-disable-next-line no-await-in-loop
    const packageSlice = await fetch(`https://api.github.com/search/code?q=extension:yaml+repo:microsoft/winget-pkgs+path:/manifests&page=${counter}&per_page=100`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    }).then(res => res.json());

    packages = [...packages, ...packageSlice.items];

    if (Math.ceil(packageSlice.total_count / 100) > counter) {
      counter += 1;
    } else {
      finished = true;
    }
  }

  fs.writeFileSync(path.join(NODE_PATH, "temp", "all_pkgs.json"), JSON.stringify(packages));
};

const fetchAllPkgs = async () => {
  const pkgList = JSON.parse(fs.readFileSync(path.join(NODE_PATH, "temp", "all_pkgs.json")).toString());

  const parsedPkgList = await Promise.all(pkgList.map((e: any) => fetch(`https://api.github.com/repos/microsoft/winget-pkgs/contents/${e.path}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3.raw",
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error(`res not ok, stats code: ${res.status}`);
    }

    return res;
  })
    .then(res => res.buffer())
    .then(buf => {
      const detected = encodingTable[encoding.detect(buf)];

      if (["utf-32", "binary", "unicode", "auto"].includes(detected)) {
        throw new Error(`unsupported encoding: ${detected}`);
      }

      const decoder = new TextDecoder(detected);
      const text = decoder.decode(buf);

      // TODO: schema
      const parsed = yaml.safeLoad(text);

      return parsed;
    })))
    .catch(console.error);

  if (parsedPkgList == null) {
    return;
  }

  fs.writeFileSync(path.join(NODE_PATH, "temp", "all_pkgs_parsed.json"), JSON.stringify(parsedPkgList));
};

(async () => {
  try {
    const packages = JSON.parse(fs.readFileSync(path.join(NODE_PATH, "temp", "all_pkgs_parsed.json")).toString());

    // const installers = packages.flatMap((e: any) => e.Installers).map((e: any) => e.Url);

    // console.log("installers (general):");
    // console.log(`total: ${installers.length}`);
    // console.log(`exe: ${installers.filter((e: any) => e.split(".").slice(-1)[0] === "exe").length}`);
    // console.log(`msi: ${installers.filter((e: any) => e.split(".").slice(-1)[0] === "msi").length}`);
    // console.log(`other: ${installers.filter((e: any) => !["exe", "msi"].includes(e.split(".").slice(-1)[0])).length}`);

    // const installersNoWeb = packages.filter((e: any) => e.Homepage == null).flatMap((e: any) => e.Installers).map((e: any) => e.Url);

    // console.log("installers (no web):");
    // console.log(`total: ${installersNoWeb.length}`);
    // console.log(`exe: ${installersNoWeb.filter((e: any) => e.split(".").slice(-1)[0] === "exe").length}`);
    // console.log(`msi: ${installersNoWeb.filter((e: any) => e.split(".").slice(-1)[0] === "msi").length}`);
    // console.log(`other: ${installersNoWeb.filter((e: any) => !["exe", "msi"].includes(e.split(".").slice(-1)[0])).length}`);

    const installerTypes = packages.filter((e: any) => e.Homepage == null).map((e: any) => e.InstallerType);
    const installerTypes2 = packages.filter((e: any) => e.Homepage == null).flatMap((e: any) => e.Installers).map((e: any) => e.InstallerType);
    console.log(installerTypes, installerTypes2);

    // const homepages: string[] = packages.filter((e: any) => e.Homepage != null).map((e: any) => e.Homepage);

    // // const homepages = ["https://awesomo.feinwaru.com/", "https://winget.run/"];

    // const homepagesNoMeta = [];

    // let errored = 0;
    // let noImage = 0;

    // const batchSize = 20;
    // for (let i = 0; i < Math.ceil(homepages.length / batchSize); i += 1) {
    //   try {
    //     // eslint-disable-next-line no-await-in-loop
    //     const batch = await Promise.allSettled(homepages.slice(i * batchSize, Math.min(i * batchSize + batchSize, homepages.length)).map(e => metaget.fetch(e)));

    //     errored += batch.filter(e => e.status === "rejected").length;

    //     const succeeded = batch.filter(e => e.status === "fulfilled");
    //     const hasImage = succeeded.filter(e => Object.keys(e.value).reduce((p, c) => p || c.includes("image"), false));

    //     // console.log(Object.keys(succeeded[10].value).reduce((p, c) => p || c.includes("image"), false));

    //     // console.log(succeeded);

    //     noImage += succeeded.length - hasImage.length;

    //     console.log(`${i}. errored: ${errored}, noimg: ${noImage}`);
    //   } catch (error) {
    //     console.error(error);
    //   }
    // }

    // console.log(`total: ${homepages.length}`);
    // console.log(`no meta: ${homepagesNoMeta.length}`);
    // console.log(`errored: ${errored}`);
  } catch (error) {
    console.error(`error: ${error}`);
  }
})();
