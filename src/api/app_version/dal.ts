import APIFeatures from "../../utils/api_features";
import IAppVersionDoc from "./dto";
import AppVersionModel from "./model";

// Data access layer for app-version
export default class AppVersion {
  // Create app version
  static async createAppVersion(
    data: AppVersionRequest.ICreateVersionInput
  ): Promise<IAppVersionDoc> {
    try {
      const appVersion = await AppVersionModel.create(data);
      return appVersion;
    } catch (error) {
      throw error;
    }
  }

  // Get all app-versions
  static async getAllVersions(query: RequestQuery): Promise<IAppVersionDoc[]> {
    try {
      const apiFeatures = new APIFeatures(AppVersionModel.find(), query)
        .sort()
        .paginate()
        .filter();
      const appVersions = await apiFeatures.dbQuery;
      return appVersions;
    } catch (error) {
      throw error;
    }
  }

  // Get latest version
  static async getLatestVersion(os: string): Promise<IAppVersionDoc[]> {
    try {
      const latestVersion = await AppVersionModel.find({ os }).sort(
        "-latest_version"
      );
      return latestVersion;
    } catch (error) {
      throw error;
    }
  }

  // Get version by id
  static async getVersion(id: string): Promise<IAppVersionDoc | null> {
    try {
      const appVersion = await AppVersionModel.findById(id);
      return appVersion;
    } catch (error) {
      throw error;
    }
  }

  // Update app version
  static async updateAppVersion(
    id: string,
    data: AppVersionRequest.IUpdateVersion
  ): Promise<IAppVersionDoc | null> {
    try {
      const appVersion = await AppVersionModel.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return appVersion;
    } catch (error) {
      throw error;
    }
  }

  // Delete all app versions
  static async deleteAllVersions() {
    try {
      await AppVersionModel.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Delete app version by id
  static async deleteVersionById(id: string): Promise<IAppVersionDoc | null> {
    try {
      const version = await AppVersionModel.findByIdAndDelete(id);
      return version;
    } catch (error) {
      throw error;
    }
  }

  // Update severity
  static async updateSeverity(
    id: string,
    highly_severe: boolean
  ): Promise<IAppVersionDoc | null> {
    try {
      const appVersion = await AppVersionModel.findByIdAndUpdate(
        id,
        { highly_severe },
        { runValidators: true, new: true }
      );
      return appVersion;
    } catch (error) {
      throw error;
    }
  }
}
