/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import path from "path";
import fs from "fs";

import fetch from "node-fetch";
// import _7zip from "7zip";

const {
  NODE_PATH,
} = process.env;

enum ImageMetaType {
  WEBSITE = "website",
  EXECUTABLE = "executable",
}

enum ImageMetaExtension {
  JPG = "jpg",
  JPEG = "jpeg",
  PNG = "png",
  ICO = "ico",
  WEBP = "webp",
  GIF = "gif",
  BMP = "bmp",
}

interface IImageMeta {
  type: ImageMetaType;
  path: string;
  extension: ImageMetaExtension;
}

// const getWebsiteImageMeta = () => {

// };

// const extractExecutableImageMeta = () => {

// };

// class Factory {
//   static create<T>(Type: (new () => T)): T {
//     return new Type();
//   }
// }

// interface ISerialisable<T> {
//   serialise(struct: T): Buffer;
//   deserialise(buffer: Buffer): T;
// }

// class SerdeBin {
//   static toBuffer<T extends ISerialisable<T>>(struct: T): Buffer {
//     return struct.serialise(struct);
//   }

//   static fromBuffer<T extends ISerialisable<T>>(TypeCls: T, buffer: Buffer): T {
//     return new TypeCls().deserialise(buffer);
//   }
// }

interface ISectionHeader {
  name: string;
  virtualSize: number;
  virtualAddress: number;
  sizeOfRawData: number;
  pointerToRawData: number;
  pointerToRelocations: number;
  pointerToLineNumbers: number;
  numberOfRelocations: number;
  numberOfLineNumbers: number;
  characteristics: number;
}

// class SectionHeader implements ISectionHeader, ISerialisable<ISectionHeader> {
//   public name!: string;

//   public virtualSize!: number;

//   public virtualAddress!: number;

//   public sizeOfRawData!: number;

//   public pointerToRawData!: number;

//   public pointerToRelocations!: number;

//   public pointerToLineNumbers!: number;

//   public numberOfRelocations!: number;

//   public numberOfLineNumbers!: number;

//   public characteristics!: number;

//   public serialise(sectionHeader: ISectionHeader): Buffer {

//   }

//   public deserialise(buffer: Buffer): ISectionHeader {

//   }
// }

interface IResourceDirectoryTable {
  characteristics: number;
  timeDateStamp: number;
  majorVersion: number;
  minorVersion: number;
  numberOfNameEntries: number;
  numberOfIdEntries: number;
}

interface IResourceDirectoryEntry {
  integerIdOrNameOffset: number;
  isSubDirectory: boolean;
  offset: number;
}

interface IResourceDirectoryString {
  length: number;
  string: string;
}

interface IResouceDirectoryDataEntry {
  dataRva: number;
  size: number;
  codepage: number;
  reserved: number;
}

const readResourceDirectoryTable = (buffer: Buffer, offset: number) => ({
  characteristics: buffer.readUInt32LE(offset + 0),
  timeDateStamp: buffer.readUInt32LE(offset + 4),
  majorVersion: buffer.readUInt16LE(offset + 8),
  minorVersion: buffer.readUInt16LE(offset + 10),
  numberOfNameEntries: buffer.readUInt16LE(offset + 12),
  numberOfIdEntries: buffer.readUInt16LE(offset + 14),
});

const readResouceDirectoryEntry = (buffer: Buffer, offset: number) => ({
  id: buffer.readUInt32LE(offset + 0),
  isDirectory: !!(buffer.readUInt32LE(offset + 4) & 0b10000000_00000000_00000000_00000000),
  offset: buffer.readUInt32LE(offset + 4) & 0b01111111_11111111_11111111_11111111,
});

const readResourceDataEntry = (buffer: Buffer, offset: number) => ({
  dataRva: buffer.readUInt32LE(offset + 0),
  size: buffer.readUInt32LE(offset + 4),
  codepage: buffer.readUInt32LE(offset + 8),
  reserved: buffer.readUInt32LE(offset + 12),
});

interface INode {
  id: number[];
  offset: number;
}

const readRsrcSection = (buffer: Buffer): any => {
  const resources = [];

  const stack: INode[] = [
    {
      id: [],
      offset: 0,
    },
  ];

  while (stack.length > 0) {
    const node = stack.pop();

    const table = readResourceDirectoryTable(buffer, node?.offset as number);

    for (let i = 0; i < table.numberOfIdEntries + table.numberOfNameEntries; i += 1) {
      const entry = readResouceDirectoryEntry(buffer, node?.offset as number + 16 + 8 * i);

      if (entry.isDirectory) {
        stack.push({
          id: [...node?.id as number[], entry.id],
          offset: entry.offset,
        });
      } else {
        resources.push({
          id: [...node?.id as number[], entry.id],
          data: readResourceDataEntry(buffer, entry.offset),
        });
      }
    }
  }

  return resources;
};

const dosStubPeOffset = 0x3c;
const peSignature = "PE\0\0";
const peSignatureSize = Buffer.from(peSignature).length;
const coffHeaderSize = 20;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loadProtableExecutable = (filePath: string): void => {
  const file = fs.readFileSync(filePath);

  const peOffset = file[dosStubPeOffset];
  const coffHeader = file.slice(peOffset, peOffset + peSignatureSize + coffHeaderSize);

  // const machine = coffHeader.slice(4, 6);
  const numberOfSections = coffHeader.slice(6, 8);
  // const timeDateStamp = coffHeader.slice(8, 12);
  // const pointerToSymbolTable = coffHeader.slice(12, 16);
  // const numberOfSymbols = coffHeader.slice(16, 20);
  const sizeOfOptionalHeader = coffHeader.slice(20, 22);
  // const characteristics = coffHeader.slice(22, 24);

  const peHeader = file.slice(peOffset + coffHeader.length, peOffset + coffHeader.length + sizeOfOptionalHeader.readUInt16LE());

  const deserialiseSectionHeader = (buffer: Buffer): ISectionHeader => ({
    name: buffer.slice(0, 8).toString(),
    virtualSize: buffer.readUInt32LE(8),
    virtualAddress: buffer.readUInt32LE(12),
    sizeOfRawData: buffer.readUInt32LE(16),
    pointerToRawData: buffer.readUInt32LE(20),
    pointerToRelocations: buffer.readUInt32LE(24),
    pointerToLineNumbers: buffer.readUInt32LE(28),
    numberOfRelocations: buffer.readUInt16LE(32),
    numberOfLineNumbers: buffer.readUInt16LE(34),
    characteristics: buffer.readUInt32LE(36),
  });

  const sectionHeaders: ISectionHeader[] = [];
  for (let i = 0; i < numberOfSections.readInt16LE(); i += 1) {
    // eslint-disable-next-line max-len
    sectionHeaders.push(deserialiseSectionHeader(file.slice(peOffset + coffHeader.length + peHeader.length + 40 * i, peOffset + coffHeader.length + peHeader.length + 40 * (i + 1))));
  }

  const deserialisedResourceSectionHeader = sectionHeaders.find(e => e.name === ".rsrc\u0000\u0000\u0000");
  if (deserialisedResourceSectionHeader == null) {
    throw new Error("could not find rsrc section");
  }

  // console.log(deserialisedResourceSectionHeader.pointerToRawData.toString(16));

  // eslint-disable-next-line max-len
  // const rsrcSection = file.slice(deserialisedResourceSectionHeader.pointerToRawData, deserialisedResourceSectionHeader.pointerToRawData + deserialisedResourceSectionHeader.sizeOfRawData);

  // const head = {
  //   characteristics: rsrcSection.readUInt32LE(0),
  //   timeDateStamp: rsrcSection.readUInt32LE(4),
  //   majorVersion: rsrcSection.readUInt16LE(8),
  //   minorVersion: rsrcSection.readUInt16LE(10),
  //   numberOfNameEntries: rsrcSection.readUInt16LE(12),
  //   numberOfIdEntries: rsrcSection.readUInt16LE(14),
  // };

  // const entries = [];
  // for (let i = 0; i < head.numberOfNameEntries + head.numberOfIdEntries; i += 1) {
  //   entries.push({
  //     id: rsrcSection.readUInt32LE(16 + 8 * i + 0),
  //     isDirectory: !!(rsrcSection.readUInt32LE(16 + 8 * i + 4) & 0b10000000_00000000_00000000_00000000),
  //     offset: rsrcSection.readUInt32LE(16 + 8 * i + 4) & 0b01111111_11111111_11111111_11111111,
  //   });
  // }

  // const resources = readRsrcSection(rsrcSection).filter((e: any) => e.id[0] === 3);

  // const test = readRsrcSection(rsrcSection, 0, 2);
  // const testDataEntry = test.entries[1].section.entries[2].section.entries[0];

  // const deserialisedTestDataEntry = {
  //   dataRva: rsrcSection.readUInt32LE(testDataEntry.offset + 0),
  //   size: rsrcSection.readUInt32LE(testDataEntry.offset + 4),
  //   codepage: rsrcSection.readUInt32LE(testDataEntry.offset + 8),
  //   reserved: rsrcSection.readUInt32LE(testDataEntry.offset + 12),
  // };

  // const resource = file.slice(deserialisedTestDataEntry.dataRva, deserialisedTestDataEntry.dataRva + deserialisedTestDataEntry.size);
  // fs.writeFileSync(path.join(NODE_PATH, "temp", "resource"), resource);

  // for (let i = 0; i < resources.length; i += 1) {
  // eslint-disable-next-line max-len
  //   fs.writeFileSync(path.join(NODE_PATH, "temp", "dump", `resource_${i}`), file.slice(resources[i].data.dataRva, resources[i].data.dataRva + resources[i].data.size));
  // }

  console.log(sectionHeaders);
};

// loadProtableExecutable(path.join(NODE_PATH, "temp", "temp", "npp.7.8.6.Installer.x64.exe"));
