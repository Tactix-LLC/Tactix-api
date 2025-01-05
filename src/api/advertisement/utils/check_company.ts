import AppError from "../../../utils/app_error";
import AdCompanyDAL from "../../ad_comp/dal";

/**
 * Checks if an advertising company exists.
 * @param adCompanyId - The ID of the advertising company.
 * @throws AppError if the company does not exist or if there's any other error.
 */
export default async (adCompanyId: string): Promise<void> => {
  // Find the company
  const adCompany = await AdCompanyDAL.getById(adCompanyId);

  // Throw error if company is not found
  if (!adCompany) {
    throw new AppError("Company does not exist", 404);
  }
};
