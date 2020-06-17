import { URL } from "url";

import fetch from "node-fetch";
import cheerio from "cheerio";


const getFallbackFavicon = async (): Promise<string> => {
  const favicon = await fetch("http://winget.run/favicon.ico")
    .then(res => res.buffer())
    .then(buf => buf.toString("base64"));

  return favicon;
};

// some sites have there websites not as just host.blah
const paraseHomepageUrl = async (url: string): Promise<string> => {
  // parse out host, so no microsoft.com/en-us/edge
  let { host } = new URL(url);

  if (host.startsWith("www.")) {
    host = host.replace("www.", "https://");
  } else {
    host = `http://${host}`;
  }

  return host;
};

const getFavicon = async (url?: string): Promise<string> => {
  // bad url get fallback
  if (url == null || url === "") {
    const favicon = await getFallbackFavicon();
    return favicon;
  }


  const host = await paraseHomepageUrl(url);

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
    .then(async res => {
      const resUrl = await paraseHomepageUrl(res.url);
      if (resUrl !== host) {
        const updatedRes = await fetch(`${resUrl}/${faviconLink}`);
        return updatedRes;
      }
      return res;
    })
    .then(res => res.buffer())
    .then(buf => buf.toString("base64"));

  return favicon;
};

export = {
  getFavicon,
};
