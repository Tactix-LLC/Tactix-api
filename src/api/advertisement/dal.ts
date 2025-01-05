import APIFeatures from "../../utils/api_features";
import IAdsDoc from "./dto";
import AdvertisementModel from "./model";

// Advertisement service
export default class Advertisement {
  // Create an Advertisement
  static async createAd(
    data: AdvertisementRequest.ICreateAdvertisementInput
  ): Promise<IAdsDoc> {
    try {
      const advertisement: IAdsDoc = await AdvertisementModel.create(data);

      return advertisement;
    } catch (error) {
      throw error;
    }
  }

  // Get all active Advertisements
  static async getAllActiveAds(): Promise<Array<IAdsDoc>> {
    try {
      const advertisements: Array<IAdsDoc> = await AdvertisementModel.find({
        is_active: true,
      })
        .populate({ path: "ad_package" })
        .populate({ path: "ad_company" });

      return advertisements;
    } catch (error) {
      throw error;
    }
  }

  // Get all Advertisements
  static async getAll(query?: RequestQuery): Promise<Array<IAdsDoc>> {
    try {
      const apiFeatures = new APIFeatures<IAdsDoc>(
        AdvertisementModel.find()
          .populate({ path: "ad_company" })
          .populate({ path: "ad_package" }),
        query
      )
        .sort()
        .project()
        .filter()
        .paginate();

      const advertisements = await apiFeatures.dbQuery;

      return advertisements;
    } catch (error) {
      throw error;
    }
  }

  //Get Advertisement by id
  static async getAdById(id: string): Promise<IAdsDoc | null> {
    try {
      //
      const advertisement = await AdvertisementModel.findById(id);

      return advertisement;
    } catch (error) {
      throw error;
    }
  }

  //Get Advertisement by name
  static async getActiveAdOfCompany(
    ad_company: string
  ): Promise<IAdsDoc | null> {
    try {
      // Find ad
      const advertisement = await AdvertisementModel.findOne({
        ad_company,
        is_active: true,
      });
      return advertisement;
    } catch (error) {
      throw error;
    }
  }

  // Get all ads of a company
  static async getAdsOfCompany(
    ad_company: string,
    query?: RequestQuery
  ): Promise<IAdsDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IAdsDoc>(
        AdvertisementModel.find({ ad_company }),
        query
      )
        .sort()
        .paginate()
        .filter()
        .project();

      const adsOfCompany = await apiFeatures.dbQuery;
      return adsOfCompany;
    } catch (error) {
      throw error;
    }
  }

  //delete a single advertisement
  static async deleteAd(id: string): Promise<void> {
    try {
      await AdvertisementModel.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  //delete all advertisements
  static async deleteAllAds(): Promise<void> {
    try {
      //
      await AdvertisementModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }

  // Update ad
  static async updateAd(
    id: string,
    data: AdvertisementRequest.IUpdateAdInput
  ): Promise<IAdsDoc | null> {
    try {
      const ad = await AdvertisementModel.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return ad;
    } catch (error) {
      throw error;
    }
  }

  // Update expiry status
  static async updateExpiryStatus(
    id: string,
    data: AdvertisementRequest.IUpdateExpiryStatus
  ): Promise<IAdsDoc | null> {
    try {
      const ad = await AdvertisementModel.findByIdAndUpdate(id, data, {
        new: true,
      });

      return ad;
    } catch (error) {
      throw error;
    }
  }

  // Update ad image
  static async updateImage(
    id: string,
    img: AdvertisementRequest.IUpdateImage
  ): Promise<IAdsDoc | null> {
    try {
      const ad = await AdvertisementModel.findByIdAndUpdate(
        id,
        { img },
        { runValidators: true, new: true }
      );
      return ad;
    } catch (error) {
      throw error;
    }
  }

  // Update ad calendar
  static async updateAdCalendar(
    id: string,
    data: AdvertisementRequest.IUpdateAdCalendar
  ): Promise<IAdsDoc | null> {
    try {
      // Update advertisement calendar
      const ad = await AdvertisementModel.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return ad;
    } catch (error) {
      throw error;
    }
  }

  // Get ads by ad_package
  static async getActiveAdsByPackage(
    ad_package: string,
    query?: RequestQuery
  ): Promise<IAdsDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IAdsDoc>(
        AdvertisementModel.find({ ad_package, is_active: true })
          .populate({ path: "ad_company" })
          .populate({ path: "ad_package" }),
        query
      )
        .paginate()
        .sort()
        .filter()
        .project();

      const ad = await apiFeatures.dbQuery;
      return ad;
    } catch (error) {
      throw error;
    }
  }

  // Get all ads by package
  static async getAllAdsByPackage(
    ad_package: string,
    query?: RequestQuery
  ): Promise<IAdsDoc[]> {
    try {
      const apiFeatures = new APIFeatures(
        AdvertisementModel.find({ ad_package })
          .populate({ path: "ad_company" })
          .populate({ path: "ad_package" }),
        query
      )
        .paginate()
        .filter()
        .sort()
        .project();

      const adsByPackage = await apiFeatures.dbQuery;
      return adsByPackage;
    } catch (error) {
      throw error;
    }
  }

  // Change status of advertisements that are in the same package to "Inactive" - will be used when deactivating a package
  static async deactivateAdsInOnePackage(ad_package: string) {
    try {
      await AdvertisementModel.updateMany(
        { ad_package, is_active: true },
        { is_active: false }
      );
    } catch (error) {
      throw error;
    }
  }
}
