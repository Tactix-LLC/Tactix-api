import { RequestHandler } from "express";
import AppError from "../../utils/app_error";
import AppVersion from "./dal";
import configs from "../../configs";

// Create app-version
export const createAppVersion: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AppVersionRequest.ICreateVersionInput>req.value;

    // Create app version
    const appVersion = await AppVersion.createAppVersion(data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "App version created successfully",
      data: { appVersion },
    });
  } catch (error) {
    next(error);
  }
};

// Get all app versions
export const getAllVersions: RequestHandler = async (req, res, next) => {
  try {
    const appVersions = await AppVersion.getAllVersions(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: appVersions.length,
      data: { appVersions },
    });
  } catch (error) {
    next(error);
  }
};

// Get latest version
export const getLatestVersion: RequestHandler = async (req, res, next) => {
  try {
    const os = req.query.os as string;
    // Latest version
    const latestVersion = await AppVersion.getLatestVersion(os);
    if (Array.isArray(latestVersion) && latestVersion.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        data: null,
      });
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { latestVersion: latestVersion[0] },
    });
  } catch (error) {
    next(error);
  }
};

// Get version by id
export const getVersion: RequestHandler = async (req, res, next) => {
  try {
    const appVersion = await AppVersion.getVersion(req.params.id);
    if (!appVersion) return next(new AppError("App version not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { appVersion },
    });
  } catch (error) {
    next(error);
  }
};

// Update version
export const updateVersion: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AppVersionRequest.IUpdateVersion>req.value;

    // Update app version
    const appVersion = await AppVersion.updateAppVersion(req.params.id, data);
    if (!appVersion) return next(new AppError("App version not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "App version updated successfully",
      data: { appVersion },
    });
  } catch (error) {
    next(error);
  }
};

// Delete all versions
export const deleteAllVersions: RequestHandler = async (req, res, next) => {
  try {
    // Check delete key
    const data = <AppVersionRequest.IDeleteAllVersions>req.value;
    if (data.delete_key !== configs.delete_key) {
      return next(new AppError("Invalid delete key", 400));
    }
    await AppVersion.deleteAllVersions();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All versions in DB deleted permanently",
    });
  } catch (error) {
    next(error);
  }
};

// Delete version by id
export const deleteVersionById: RequestHandler = async (req, res, next) => {
  try {
    const version = await AppVersion.deleteVersionById(req.params.id);
    if (!version) return next(new AppError("App version not found", 400));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "App vesion delete permanently",
    });
  } catch (error) {
    next(error);
  }
};

// Update app version severity
export const updateSeverity: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AppVersionRequest.IUpdateSeverity>req.value;
    const appVersion = await AppVersion.updateSeverity(
      req.params.id,
      data.highly_severe
    );
    if (!appVersion) return next(new AppError("App version not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Severity level of the app version updated",
      data: { appVersion },
    });
  } catch (error) {
    next(error);
  }
};
