import { IBase } from "./base";

// TODO validation and enums
interface IPackage extends IBase {
  Id: string;

  // version stuff
  Versions: string[];
  Latest: {
    Name: string;
    Publisher: string;
    Tags: string[];
    Description?: string;
    License?: string;
  };

  // extra
  Featured: boolean;
  IconUrl?: string;
  Banner?: string;

  // search
  NGrams: {
    Name: string;
    Publisher: string;
    Tags?: string;
    Description?: string;
  };

  // stats
  UpdatedAt: Date;
}

interface IPackageQueryOptions {
  query?: string;
  name?: string;
  publisher?: string;
  description?: string;
  tags?: string[];
}

enum PackageSortFields {
  LatestName = "Latest.Name",
  UpdatedAt = "UpdatedAt",
}

export {
  // eslint-disable-next-line import/prefer-default-export
  IPackage,
  IPackageQueryOptions,
  PackageSortFields,
};
