import { URL } from "url";

import fetch from "node-fetch";
import cheerio from "cheerio";


const getFallbackFavicon = async (): Promise<string> => {
  const favicon = await fetch("http://winget.run/favicon.ico")
    .then(res => res.buffer())
    .then(buf => buf.toString("base64"));

  return favicon;
};

const getFavicon = async (url?: string): Promise<string> => {
  // bad url get fallback
  if (url == null || url === "") {
    const favicon = await getFallbackFavicon();
    return favicon;
  }

  // parse out host, so no microsoft.com/en-us/edge
  let { host } = new URL(url);

  if (host.startsWith("www.")) {
    host = host.replace("www.", "https://");
  } else {
    host = `http://${host}`;
  }

  // parse html to get <link> with rel icon
  let faviconLink: string | undefined = "";
  await fetch(host)
    .then(res => res.text())
    .then(body => {
      const $ = cheerio.load(body);
      const a = $("link");
      $(a).each((i, link) => {
        const attr = $(link).attr("rel");
        if (attr?.includes("icon")) {
          const href = $(link).attr("href");
          faviconLink = href?.toString();
        }
      });
    });

  // get fallback if the parse fucked up
  if (faviconLink == null || faviconLink === "") {
    const favicon = await getFallbackFavicon();
    return favicon;
  }

  // get favicon
  const favicon = await fetch(`${host}/${faviconLink}`)
    .then(res => res.buffer())
    .then(buf => buf.toString("base64"));

  return favicon;
};

export = {
  getFavicon,
};
