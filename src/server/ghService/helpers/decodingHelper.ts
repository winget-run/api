import { TextDecoder } from "util";
import encoding from "encoding-japanese";

import * as jsYaml from "js-yaml";

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

const parsePackageYaml = async (buf: Buffer): Promise<string> => {
  let parsedYaml;

  try {
    const detected = encodingTable[encoding.detect(buf)];
    if (["utf-32", "binary", "unicode", "auto"].includes(detected)) {
      console.log(`unsupported encoding: ${detected}`);
    }
    const decoder = new TextDecoder(detected);

    const text = decoder.decode(buf);

    parsedYaml = jsYaml.safeLoad(text);
    parsedYaml.Version = String(parsedYaml.Version);
  } catch (error) {
    console.log(error);
  }

  return parsedYaml;
};

export {
  // eslint-disable-next-line import/prefer-default-export
  parsePackageYaml,
};
