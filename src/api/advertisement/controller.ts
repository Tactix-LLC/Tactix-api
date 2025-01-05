import { RequestHandler, json } from "express";
import Advertisement from "./dal";
import AppError from "../../utils/app_error";
import cloudinary from "../../utils/cloudinary";
import configs from "../../configs";
import IAdsDoc from "./dto";
import AdPackageDAL from "../ad_packages/dal";
import getEndDate from "./utils/end_date";
import checkCompanyExists from "./utils/check_company";

//create new advertisement controller
export const createAdvertisement: RequestHandler = async (req, res, next) => {
  try {
    const data = <AdvertisementRequest.ICreateAdvertisementInput>req.value;

    // Validate start date is not less or equal to today and the past
    if (new Date(data.start_date).getTime() < new Date(Date.now()).getTime()) {
      return next(
        new AppError("You can not create advertisement for past days.", 400)
      );
    }

    // Check company
    await checkCompanyExists(data.ad_company);

    // Check ad packag
    const endDate = await getEndDate(data.ad_package, data.start_date);
    data.end_date = endDate;

    // Create advertisement
    const advertisement = await Advertisement.createAd(data);

    res.status(200).json({
      status: "SUCCESS",
      message: "Advertisement created successfuly",
      data: { advertisement },
    });
  } catch (error) {
    next(error);
  }
};

//delete Ad By id
export const deleteAdvertisement: RequestHandler = async (req, res, next) => {
  try {
    //check if Advertisement exist
    const advertisement = await Advertisement.getAdById(req.params.id);

    if (!advertisement) {
      return next(new AppError("Advertisement does not exist", 404));
    }

    await cloudinary.v2.uploader.destroy(
      advertisement.img.cloudinary_public_id
    );

    await Advertisement.deleteAd(req.params.id);

    res.status(200).json({
      status: "SUCCESS",
      message: "Advertisement deleted successfuly",
    });
  } catch (error) {
    next(error);
  }
};

//delete All Ads
export const deleteAdvertisements: RequestHandler = async (req, res, next) => {
  try {
    // Check delete key
    const data = <AdvertisementRequest.IDeleteAllAds>req.value;

    if (data.delete_key !== configs.delete_key) {
      return next(new AppError("Please provide a valid delete key", 400));
    }

    //fetch all existing ads
    const advertisements = await Advertisement.getAllActiveAds();

    //delete all advertisement images from cloudinary
    advertisements.map(async (ad: IAdsDoc) => {
      await cloudinary.v2.uploader.destroy(ad.img.cloudinary_public_id);
    });

    await Advertisement.deleteAllAds();

    res.status(200).json({
      status: "SUCCESS",
      message: "Advertisement deleted successfuly",
    });
  } catch (error) {
    next(error);
  }
};

// Get all ads
export const getAllAds: RequestHandler = async (req, res, next) => {
  try {
    // Get package name from request query
    const { ad_package } = req.query;

    if (ad_package) {
      // Get all ad packages/spots
      const adPackages = await AdPackageDAL.getAllActivePackages();

      const adPackage = adPackages.filter((advPack) => {
        return advPack.pack_name_slug === ad_package;
      });

      let ads: any[];
      if (adPackage.length === 1) {
        ads = await Advertisement.getActiveAdsByPackage(adPackage[0].id);
      } else {
        ads = [];
      }
      // Get advertisements by package
      // Response
      res.status(200).json({
        status: "SUCCESS",
        results: ads.length,
        data: { ads },
      });
    } else {
      // Fetch all active adevertisements
      const ads = await Advertisement.getAllActiveAds();

      // Response
      res.status(200).json({
        status: "SUCCESS",
        results: ads.length,
        data: { ads },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get Ad
export const getAd: RequestHandler = async (req, res, next) => {
  try {
    const ad = await Advertisement.getAdById(req.params.id);
    if (!ad) return next(new AppError("Ad not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { ad },
    });
  } catch (error) {
    next(error);
  }
};

// Get Ads
export const getEveryAds: RequestHandler = async (req, res, next) => {
  try {
    const ads = await Advertisement.getAll(req.query);
    if (!ads) return next(new AppError("Ad not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: ads.length,
      data: { ads },
    });
  } catch (error) {
    next(error);
  }
};

// Update ad
export const updateAd: RequestHandler = async (req, res, next) => {
  try {
    // Request body and id
    const id = req.params.id;
    const data = <AdvertisementRequest.IUpdateAdInput>req.value;

    //Update ad
    const ad = await Advertisement.updateAd(id, data);
    if (!ad) return next(new AppError("Ad not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Ad updated successfully",
      data: { ad },
    });
  } catch (error) {
    next(error);
  }
};

// Update expiry status
export const updateAdStatus: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id; // Id from req.params
    const data = <AdvertisementRequest.IUpdateExpiryStatus>req.value; // Request body

    // Update ad's expiry status
    const ad = await Advertisement.updateExpiryStatus(id, data);
    if (!ad) return next(new AppError("Ad not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Expiry status of ad updated successfully",
      data: { ad },
    });
  } catch (error) {
    next(error);
  }
};

// Update ad image
export const updateImage: RequestHandler = async (req, res, next) => {
  try {
    // Update image
    const ad = await Advertisement.updateImage(req.params.id, req.body.img);
    if (!ad) return next(new AppError("Ad not found", 404));

    // Delete ad's existing image
    await cloudinary.v2.uploader.destroy(ad?.img.cloudinary_public_id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Ad image updated successfully",
      data: { ad },
    });
  } catch (error) {
    next(error);
  }
};

// Update start and expire date of an advertisement
export const updateAdCalendar: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AdvertisementRequest.IUpdateAdCalendar>req.value;

    // If expire date is less than today(now), set 'is_active' field to false
    if (data.end_date < new Date()) {
      const expiredAd = await Advertisement.updateExpiryStatus(req.params.id, {
        is_active: false,
      });

      // Check ad exists
      if (!expiredAd) return next(new AppError("Ad not found", 404));
    }
    // Else if expire date is greater than today, set "is_active" to true
    else {
      const notExpiredAd = await Advertisement.updateExpiryStatus(
        req.params.id,
        {
          is_active: true,
        }
      );

      // Check ad exists
      if (!notExpiredAd) return next(new AppError("Ad not found", 404));
    }

    // Update start and expire date of ad
    const ad = await Advertisement.updateAdCalendar(req.params.id, data);
    if (!ad) return next(new AppError("Ad not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Start and expire date of an ad updated successfully",
      data: { ad },
    });
  } catch (error) {
    next(error);
  }
};

// Get active ad by company
export const getActiveAdOfCompany: RequestHandler = async (req, res, next) => {
  try {
    console.log(req.params.compId);
    const activeAdOfCompany = await Advertisement.getActiveAdOfCompany(
      req.params.compId
    );
    if (!activeAdOfCompany) return next(new AppError("Ad not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { activeAdOfCompany },
    });
  } catch (error) {
    next(error);
  }
};

// Get all ads of a company
export const getAdsOfCompany: RequestHandler = async (req, res, next) => {
  try {
    const adsOfCompany = await Advertisement.getAdsOfCompany(
      req.params.compId,
      req.query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: adsOfCompany.length,
      data: { adsOfCompany },
    });
  } catch (error) {
    next(error);
  }
};

// Get active ads by package
export const getActiveAdsByPackage: RequestHandler = async (req, res, next) => {
  try {
    const activeAdsByPackage = await Advertisement.getActiveAdsByPackage(
      req.params.packId,
      req.query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: activeAdsByPackage.length,
      data: { activeAdsByPackage },
    });
  } catch (error) {
    next(error);
  }
};

// Get ads by package
export const getAdsByPackage: RequestHandler = async (req, res, next) => {
  try {
    const adsByPackage = await Advertisement.getAllAdsByPackage(
      req.params.packId,
      req.query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: adsByPackage.length,
      data: { adsByPackage },
    });
  } catch (error) {
    next(error);
  }
};
