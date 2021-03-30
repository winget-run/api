import { Column, Entity } from "typeorm";

import BaseModel from "./base";
import { IManifest } from "../types";

@Entity()
class ManifestModel extends BaseModel implements IManifest {
  @Column()
  public PackageIdentifier!: string;

  @Column()
  public PackageName!: string;

  @Column()
  public AppMoniker?: string;

  @Column()
  public PackageVersion!: string;

  @Column()
  public PackageLocale?: string;

  @Column()
  public Publisher!: string;

  @Column()
  PublisherURL?: string;

  @Column()
  PrivacyURL?: string;

  @Column()
  public Channel?: string;

  @Column()
  public Author?: string;

  @Column()
  public License?: string;

  @Column()
  public LicenseUrl?: string;

  @Column()
  public MinOSVersion?: string;

  @Column()
  public ShortDescription?: string;

  @Column()
  PackageUrl?: string;

  @Column()
  public Homepage?: string;

  @Column()
  public Tags?: string[];

  @Column()
  ManifestType?: string;

  @Column()
  ManifestVersion?: string;

  @Column()
  public FileExtensions?: string;

  @Column()
  public Protocols?: string;

  @Column()
  public Commands?: string;

  @Column()
  public InstallerType?: string;

  @Column()
  public Switches?: {
    Custom?: string;
    Silent?: string;
    SilentWithProgress?: string;
    Interactive?: string;
    Language?: string;
  };

  @Column()
  public Log?: string;

  @Column()
  public InstallLocation?: string;

  @Column()
  public Installers!: [
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

  @Column()
  public Localization?: [
    {
      Language: string;
      Description?: string;
      Homepage?: string;
      LicenseUrl?: string;
    }
  ];
}

export default ManifestModel;
