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
    Homepage?: string;
    License?: string;
    LicenseUrl?: string;
  };

  // extra
  Featured: boolean;
  IconUrl?: string;
  Banner?: string;
  Logo?: string;

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

interface IPackageSearchOptions {
  splitQuery?: boolean;
  partialMatch?: boolean;
  ensureContains?: boolean;
}

enum PackageSortFields {
  LatestName = "Latest.Name",
  LatestPublisher = "Latest.Publisher",
  UpdatedAt = "UpdatedAt",
}

export {
  IPackage,
  IPackageQueryOptions,
  IPackageSearchOptions,
  PackageSortFields,
};
