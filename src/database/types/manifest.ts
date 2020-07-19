import { IBase } from "./base";

interface IManifest extends IBase {
  Id: string;
  Name: string;
  AppMoniker?: string;
  Version: string;
  Publisher: string;
  Channel?: string;
  Author?: string;
  License?: string;
  LicenseUrl?: string;
  MinOSVersion?: string;
  Description?: string;
  Homepage?: string;
  Tags?: string;
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
      Arch: string;
      Url: string;
      Sha256: string;
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
