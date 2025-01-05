import { RequestHandler } from "express";
import AdPackage from "./dal";
import slugifer from "../../utils/slugfier";
import AppError from "../../utils/app_error";
import configs from "../../configs";
import Advertisement from "../advertisement/dal";

// Create ad package
export const createAdPackage: RequestHandler = async (req, res, next) => {
  try {
    const data = <AdPackagesRequests.ICreateInput>req.value;

    // Create the slug for the add name and make the slug in lower case
    data.pack_name_slug = slugifer(data.pack_name).toLowerCase();

    // Create the ad package
    const adPackage = await AdPackage.createAdPackage(data);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Ad package created successfully",
      data: { adPackage },
    });
  } catch (error) {
    next(error);
  }
};

// Get all ad packages - both active and inactive packages
export const getAllAdpackages: RequestHandler = async (req, res, next) => {
  try {
    const adPackages = await AdPackage.getAllPackages(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: adPackages.length,
      data: { adPackages },
    });
  } catch (error) {
    next(error);
  }
};

// Get all active ad-packages
export const getAllActiveAdPackages: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const activeAdPackages = await AdPackage.getAllActivePackages(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: activeAdPackages.length,
      data: { activeAdPackages },
    });
  } catch (error) {
    next(error);
  }
};

// Get ad package by id
export const getById: RequestHandler = async (req, res, next) => {
  try {
    const adPackage = await AdPackage.getById(req.params.id);
    if (!adPackage)
      return next(new AppError("Advertisement package not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { adPackage },
    });
  } catch (error) {
    next(error);
  }
};

// Upadte ad package
export const updateAdPackage: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AdPackagesRequests.IUpdateInput>req.value;

    // Update ad package
    const adPackage = await AdPackage.updateAdPackage(req.params.id, data);
    if (!adPackage) return next(new AppError("Ad package not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Ad package updated successfully",
      data: { adPackage },
    });
  } catch (error) {
    next(error);
  }
};

// Delete all ad packages in DB
export const deleteAllAdPackages: RequestHandler = async (req, res, next) => {
  try {
    // Delete key
    const data = <AdPackagesRequests.IDeleteAllPackages>req.value;

    // Check a valid delete key is provided
    if (data.delete_key !== configs.delete_key) {
      return next(new AppError("Please provide a valid delete key", 400));
    }

    await AdPackage.delteAllAdPackages(); // Delete all ad packages

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All advertisement packages have been deleted permanently",
    });
  } catch (error) {
    next(error);
  }
};

// Delete ad package by id
export const deleteById: RequestHandler = async (req, res, next) => {
  try {
    const deletedAdPackge = await AdPackage.deleteById(req.params.id);
    if (!deletedAdPackge)
      return next(new AppError("Ad package does not exist", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Ad package has been deleted permanently",
    });
  } catch (error) {
    next(error);
  }
};

// Update status
export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    const data = <AdPackagesRequests.IUpdateStatusInput>req.value;

    const adPackage = await AdPackage.updateStatus(req.params.id, data);
    if (!adPackage) return next(new AppError("Ad package does not exist", 404));

    // If status value is "Inactive", deactivate all active ads that reference this package
    if (data.status === "Inactive") {
      await Advertisement.deactivateAdsInOnePackage(adPackage.id);
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Status of ad package updated successfully",
      data: { adPackage },
    });
  } catch (error) {
    next(error);
  }
};
