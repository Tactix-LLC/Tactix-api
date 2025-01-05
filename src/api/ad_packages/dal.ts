import APIFeatures from "../../utils/api_features";
import IAdPackagesDoc from "./dto";
import AdPackages from "./model";

/**
 * Data access layer for ad packages data
 */
export default class AdPackageDAL {
  // Create ad package
  static async createAdPackage(
    data: AdPackagesRequests.ICreateInput
  ): Promise<IAdPackagesDoc> {
    try {
      const adPackage = await AdPackages.create(data);
      return adPackage;
    } catch (error) {
      throw error;
    }
  }

  // Get all ad-packages - both active and inactive
  static async getAllPackages(query?: RequestQuery): Promise<IAdPackagesDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IAdPackagesDoc>(
        AdPackages.find(),
        query
      )
        .paginate()
        .filter()
        .project()
        .sort();

      const adPackages = await apiFeatures.dbQuery;
      return adPackages;
    } catch (error) {
      throw error;
    }
  }

  // Get all active ad-packages
  static async getAllActivePackages(
    query?: RequestQuery
  ): Promise<IAdPackagesDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IAdPackagesDoc>(
        AdPackages.find({ status: "Active" }),
        query
      )
        .paginate()
        .filter()
        .project()
        .sort();

      const adPackages = await apiFeatures.dbQuery;
      return adPackages;
    } catch (error) {
      throw error;
    }
  }

  // Get ad package by id
  static async getById(id: string): Promise<IAdPackagesDoc | null> {
    try {
      const adPackage = await AdPackages.findById(id);
      return adPackage;
    } catch (error) {
      throw error;
    }
  }

  // Update ad package
  static async updateAdPackage(
    id: string,
    data: AdPackagesRequests.IUpdateInput
  ): Promise<IAdPackagesDoc | null> {
    try {
      const adPackage = await AdPackages.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return adPackage;
    } catch (error) {
      throw error;
    }
  }

  // Delete all ad packages
  static async delteAllAdPackages() {
    try {
      await AdPackages.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Delete ad package by id
  static async deleteById(id: string): Promise<IAdPackagesDoc | null> {
    try {
      const deleteAdPackage = await AdPackages.findByIdAndDelete(id);
      return deleteAdPackage;
    } catch (error) {
      throw error;
    }
  }

  // Update status
  static async updateStatus(
    id: string,
    data: AdPackagesRequests.IUpdateStatusInput
  ): Promise<IAdPackagesDoc | null> {
    try {
      const adPackage = await AdPackages.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return adPackage;
    } catch (error) {
      throw error;
    }
  }
}
