import importPackageUtil from "./import/importPackageUtil";
import manualPackageImportUtil from "./import/manualImportUtil";
import updatePackageUtil from "./update/updatePackageUtil";
import manualPackageUpdateUtil from "./update/manualPackageUpdateUtil";
import singlePackageImportUtil from "./import/singlePackageImport";

const initialPackageImport = async (): Promise<string[]> => {
  const packageYamls = await importPackageUtil.getPackageYamls();

  return packageYamls;
};

const manualPackageImport = async (manifests: string[]): Promise<string[]> => {
  const importedYaml = await manualPackageImportUtil.getPackageYamls(manifests);
  return importedYaml;
};

const updatePackages = async (): Promise<string[]> => {
  const updatePackageYamls = await updatePackageUtil.getUpdatedPackageYamls();

  return updatePackageYamls;
};

const manualPackageUpdate = async (since: Date, until: Date): Promise<string[]> => {
  const updatedPackageYamls = await manualPackageUpdateUtil.getUpdatedPackageYamls(since, until);

  return updatedPackageYamls;
};

const importSinglePackage = async (manifestPath: string): Promise<string> => {
  const singleYaml = await singlePackageImportUtil.getPackageYaml(manifestPath);

  return singleYaml;
};

export = {
  initialPackageImport,
  manualPackageImport,
  updatePackages,
  manualPackageUpdate,
  importSinglePackage,
};
