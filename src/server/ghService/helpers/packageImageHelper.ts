import { isNullOrUndefined } from "util";

import fetch from "node-fetch";
import { URL } from "url";

const getFavicon = async (url?: string): Promise<string> => {
  if (isNullOrUndefined(url) || url === "") {
    const favicon = await fetch("http://winget.run/favicon.ico")
      .then(res => res.buffer())
      .then(buf => buf.toString("base64"));

    console.log("nonce");

    return favicon;
  }

  let { host } = new URL(url);

  if (host.startsWith("www.")) {
    host = host.replace("www.", "https://");
  } else {
    host = `http://${host}`;
  }

  console.log(host);

  const favicon = await fetch(`${host}/favicon.ico`)
    .then(res => res.buffer())
    .then(buf => buf.toString("base64"));

  return favicon;
};

export = {
  getFavicon,
};
