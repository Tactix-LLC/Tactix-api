import Packages from "./dal";
import AppError from "../../utils/app_error";
import { RequestHandler } from "express";

import configs from "../../configs";

// Create a new package
export const createNewPackage: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { price, game_weeks, discount } = <PackagesRequest.ICreatePackage>(
      req.value
    );

    // Create a package
    const newPackage = await Packages.createPackage({
      price,
      game_weeks,
      discount,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "New package is successfully created",
      data: {
        package: newPackage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all packages
export const getAllPackages: RequestHandler = async (req, res, next) => {
  try {
    const packages = await Packages.getAllPackages();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: packages.length,
      data: {
        packages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get active packages
export const getActivePackages: RequestHandler = async (req, res, next) => {
  try {
    const packages = await Packages.getActivePackages();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: packages.length,
      data: {
        packages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single package
export const getPackage: RequestHandler = async (req, res, next) => {
  try {
    const discountPackage = await Packages.getPackage(req.params.id);
    if (!discountPackage)
      return next(
        new AppError("There is no package with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        discountPackage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update package status
export const updatePackageStatus: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { is_active } = <PackagesRequest.IUpdatePackageStatus>req.value;

    // Update
    const discountPackage = await Packages.updatePackageStatus({
      is_active,
      id: req.params.id,
    });
    if (!discountPackage)
      return next(
        new AppError("There is no package with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Package status succesfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Delete a package
export const deletePackage: RequestHandler = async (req, res, next) => {
  try {
    const discountPackage = await Packages.deletePackage(req.params.id);
    if (!discountPackage)
      return next(
        new AppError("There is no package with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Package successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all packages
export const deleteAllPackages: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { delete_key } = <PackagesRequest.IDeleteAllPackages>req.value;

    // Check the delete key
    if (delete_key !== configs.delete_key)
      return next(new AppError("Invalid delete key", 400));

    // Delete
    await Packages.deleteAllPackages();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "All packages successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};
