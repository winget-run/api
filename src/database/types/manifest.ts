import { IBase } from "./base";

interface IManifest extends IBase {
  PackageIdentifier: string;
  PackageName: string;
  AppMoniker?: string;
  PackageVersion: string;
  PackageLocale?: string;
  Publisher: string;
  PublisherURL?: string;
  PrivacyURL?: string;
  Channel?: string;
  Author?: string;
  License?: string;
  LicenseUrl?: string;
  MinOSVersion?: string;
  ShortDescription?: string;
  PackageUrl?: string;
  Homepage?: string;
  Tags?: string[];
  ManifestType?: string;
  ManifestVersion?: string;
  FileExtensions?: string;
  Protocols?: string;
  Commands?: string;
  InstallerType?: string;
  Switches?: {
    Custom?: string;
    Silent?: string;
    SilentWithProgress?: string;
    Interactive?: string;
    Language?: string;
  };
  Log?: string;
  InstallLocation?: string;
  Installers: [
    {
      Architecture: string;
      InstallerUrl: string;
      InstallerSha256: string;
      SignatureSha256?: string;
      Language?: string;
      InstallerType?: string;
      Scope?: string;
      SystemAppId?: string;
      Switches?: {
        Language?: string;
        Custom?: string;
      };
    }
  ];
  Localization?: [
    {
      Language: string;
      Description?: string;
      Homepage?: string;
      LicenseUrl?: string;
    }
  ];
}

export {
  // eslint-disable-next-line import/prefer-default-export
  IManifest,
};
