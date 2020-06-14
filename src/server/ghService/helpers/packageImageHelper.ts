import { isNullOrUndefined } from "util";

import fetch from "node-fetch";
import { URL } from "url";

const getFavicon = async (url: string): Promise<string> => {
  if (isNullOrUndefined(url)) {
    return "noURL";
  }

  let { host } = new URL(url);
  host = host.replace("www.", "http://");

  const favicon = await fetch(`${host}/favicon.ico`)
    .then(res => res.buffer())
    .then(buf => buf.toString("base64"));

  return favicon;
};

export = {
  getFavicon,
};
