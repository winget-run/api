import { isNullOrUndefined } from "util";
import fetch from "node-fetch";

const getFavicon = async (url: string): Promise<string> => {
  if (isNullOrUndefined(url)) {
    return "noURL";
  }
  const favicon = await fetch(`${url}/favicon.ico`);
  console.log(favicon);

  return "yeet";
};

export = {
  getFavicon,
};
