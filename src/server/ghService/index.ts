import importPackageUtil from "./importPackageUtil";
import updatePackageUtil from "./updatePackageUtil";

const initialPackageImport = async (): Promise<string[]> => {
  const packageYamls = await importPackageUtil.getPackageYamls();

  return packageYamls;
};

const updatePackages = async (): Promise<string[]> => {
  const updatePackageYamls = await updatePackageUtil.getUpdatedPackageYamls();

  return updatePackageYamls;
};

export = {
  initialPackageImport,
  updatePackages,
};
