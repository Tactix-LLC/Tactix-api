import IPackagesDoc from "./dto";
import PackagesModel from "./model";

// Packages Service
export default class Packages {
  // Create a package
  static async createPackage(
    data: PackagesRequest.ICreatePackage
  ): Promise<IPackagesDoc> {
    try {
      // Total amount
      const total_amount = data.price * data.game_weeks;

      // Total Discounted amount
      const discounted_total_amount = total_amount - data.discount;

      const newPackage = await PackagesModel.create({
        price: data.price,
        game_weeks: data.game_weeks,
        total_amount,
        discount: data.discount,
        discounted_total_amount,
      });

      return newPackage;
    } catch (error) {
      throw error;
    }
  }

  // Get all packages
  static async getAllPackages(): Promise<IPackagesDoc[]> {
    try {
      const packages = await PackagesModel.find();
      return packages;
    } catch (error) {
      throw error;
    }
  }

  // Get active packages
  static async getActivePackages(): Promise<IPackagesDoc[]> {
    try {
      const packages = await PackagesModel.find({ is_active: true });
      return packages;
    } catch (error) {
      throw error;
    }
  }

  // Get a single package
  static async getPackage(id: string): Promise<IPackagesDoc | null> {
    try {
      const discountPackage = await PackagesModel.findById(id);
      return discountPackage;
    } catch (error) {
      throw error;
    }
  }

  // Update package status
  static async updatePackageStatus(data: {
    id: string;
    is_active: boolean;
  }): Promise<IPackagesDoc | null> {
    try {
      const discountPackage = await PackagesModel.findByIdAndUpdate(
        data.id,
        { is_active: data.is_active },
        { runValidators: true, new: true }
      );
      return discountPackage;
    } catch (error) {
      throw error;
    }
  }

  // Delete a package
  static async deletePackage(id: string): Promise<IPackagesDoc | null> {
    try {
      const discountPackage = await PackagesModel.findByIdAndDelete(id);
      return discountPackage;
    } catch (error) {
      throw error;
    }
  }

  // Delete all packages
  static async deleteAllPackages() {
    try {
      await PackagesModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }
}
