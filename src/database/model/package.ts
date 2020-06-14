import { Column, Entity } from "typeorm";

import BaseModel from "./base";
import { IPackage } from "../types/package";

@Entity()
class PackageModel extends BaseModel implements IPackage {
  @Column()
  public Id!: string;

  @Column()
  public Name!: string;

  @Column()
  public AppMoniker?: string;

  @Column()
  public Version!: string;

  @Column()
  public Publisher!: string;

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
  public Description?: string;

  @Column()
  public Homepage?: string;

  @Column()
  public Tags?: string;

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
      Arch: string;
      Url: string;
      Sha256: string;
      SignatureSha256?: string;
      Language?: string;
      InstallerType: string;
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

  @Column()
  public Favicon?: string;
}

export default PackageModel;
