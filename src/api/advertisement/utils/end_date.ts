import AppError from "../../../utils/app_error";
import AdPackageDAL from "../../ad_packages/dal";

/**
 * Checks if ad package exists and returns the end date for the advertisement.
 * @param packageId - The ID of the ad package.
 * @param startDate - The start date of the advertisement.
 * @returns A Promise<Date> representing the end date of the advertisement.
 * @throws AppError if the selected package is unknown or if there's any other error.
 */
export default async (packageId: string, startDate: Date): Promise<Date> => {
  // Check if the ad package exists
  const selectedPackage = await AdPackageDAL.getById(packageId);
  if (!selectedPackage) {
    throw new AppError("Selected package does not exist", 404);
  }

  // Calculate the end date based on the start date and duration of the selected package
  return new Date(
    startDate.getTime() + selectedPackage.duration * 24 * 60 * 60 * 1000
  );
};
