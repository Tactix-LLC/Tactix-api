import AdCompany from "./model";
import IAdCompanyDoc from "./dto";
import APIFeatures from "../../utils/api_features";

/**
 * Data access layer for ad company data
 */
export default class AdCompanyDAL {
  // Create company
  static async createCompany(
    data: AdCompanyRequests.ICreateInput
  ): Promise<IAdCompanyDoc> {
    try {
      const company = await AdCompany.create(data);
      return company;
    } catch (error) {
      throw error;
    }
  }

  // Get all companies
  static async getAll(query?: RequestQuery): Promise<IAdCompanyDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IAdCompanyDoc>(
        AdCompany.find(),
        query
      )
        .paginate()
        .filter()
        .sort()
        .project();

      const adCompanies = await apiFeatures.dbQuery;
      return adCompanies;
    } catch (error) {
      throw error;
    }
  }

  // Get company by id
  static async getById(id: string): Promise<IAdCompanyDoc | null> {
    try {
      const adCompany = await AdCompany.findById(id);
      return adCompany;
    } catch (error) {
      throw error;
    }
  }

  // Update company info
  static async updateInfo(
    id: string,
    data: AdCompanyRequests.IUpdateInput
  ): Promise<IAdCompanyDoc | null> {
    try {
      const company = await AdCompany.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return company;
    } catch (error) {
      throw error;
    }
  }

  // Delete all companies
  static async deleteAll() {
    try {
      await AdCompany.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Delete by id
  static async deleteById(id: string): Promise<IAdCompanyDoc | null> {
    try {
      const adCompany = await AdCompany.findByIdAndDelete(id);
      return adCompany;
    } catch (error) {
      throw error;
    }
  }
}
