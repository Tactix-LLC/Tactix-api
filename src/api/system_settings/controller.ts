import { RequestHandler } from "express";
import SystemSettings from "./model";

/**
 * Get system settings
 */
export const getSystemSettings: RequestHandler = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne().sort({ created_at: -1 });
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    
    res.status(200).json({
      status: "SUCCESS",
      message: "System settings retrieved successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update system settings
 */
export const updateSystemSettings: RequestHandler = async (req, res, next) => {
  try {
    const updates = req.value;
    
    let settings = await SystemSettings.findOne().sort({ created_at: -1 });
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    Object.assign(settings, updates);
    await settings.save();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "System settings updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset to default settings
 */
export const resetToDefaultSettings: RequestHandler = async (req, res, next) => {
  try {
    // Delete existing settings
    await SystemSettings.deleteMany({});
    
    // Create new default settings
    const defaultSettings = await SystemSettings.create({});
    
    res.status(200).json({
      status: "SUCCESS",
      message: "System settings reset to default successfully",
      data: defaultSettings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get point system
 */
export const getPointSystem: RequestHandler = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne().sort({ created_at: -1 });
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Point system retrieved successfully",
      data: settings.point_system,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update point system
 */
export const updatePointSystem: RequestHandler = async (req, res, next) => {
  try {
    const pointSystemUpdates = req.value;
    
    let settings = await SystemSettings.findOne().sort({ created_at: -1 });
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    
    // Update point system
    const updatedPointSystem = {
      ...settings.point_system,
      ...pointSystemUpdates,
    };
    
    settings.point_system = updatedPointSystem;
    await settings.save();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Point system updated successfully",
      data: settings.point_system,
    });
  } catch (error) {
    next(error);
  }
};
