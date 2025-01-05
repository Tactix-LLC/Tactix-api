import { RequestHandler } from "express";
import AppError from "../../utils/app_error";
import AdCompany from "./dal";
import slugifer from "../../utils/slugfier";
import configs from "../../configs";

// Create company
export const createCompany: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AdCompanyRequests.ICreateInput>req.value;

    // Check phone number is provided
    if (!data.comp_contact.phone_number) {
      return next(new AppError("Please add phone number", 400));
    }

    // Slugify the company name and change all letters to lower case
    data.comp_name_slug = slugifer(data.comp_name);
    data.comp_name_slug = data.comp_name_slug.toLowerCase();

    // Create company
    const company = await AdCompany.createCompany(data);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "New company created successfully",
      data: { company },
    });
  } catch (error) {
    next(error);
  }
};

// Get all ad companies
export const getAllAdCompanies: RequestHandler = async (req, res, next) => {
  try {
    const adCompanies = await AdCompany.getAll(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: adCompanies.length,
      data: { adCompanies },
    });
  } catch (error) {
    next(error);
  }
};

// Get by id
export const getById: RequestHandler = async (req, res, next) => {
  try {
    const adCompany = await AdCompany.getById(req.params.id);
    if (!adCompany) return next(new AppError("Company not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { adCompany },
    });
  } catch (error) {
    next(error);
  }
};

// Update company info
export const updateCompanyInfo: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AdCompanyRequests.IUpdateInput>req.value;
    if (data.comp_name) {
      data.comp_name_slug = slugifer(data.comp_name);
      data.comp_name_slug = data.comp_name_slug.toLowerCase();
    }

    // Update info
    const adCompany = await AdCompany.updateInfo(req.params.id, data);
    if (!adCompany) return next(new AppError("Company not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Company info updated successfully",
      data: { adCompany },
    });
  } catch (error) {
    next(error);
  }
};

// Deelte all companies in DB
export const deleteAll: RequestHandler = async (req, res, next) => {
  try {
    // Check delete key
    const data = <AdCompanyRequests.IDeleteAllCompanies>req.value;
    if (data.delete_key !== configs.delete_key) {
      return next(new AppError("Invalid delete key", 400));
    }

    await AdCompany.deleteAll();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All companies in DB have been deleted permanently",
    });
  } catch (error) {
    next(error);
  }
};

// Delete by id
export const deleteById: RequestHandler = async (req, res, next) => {
  try {
    const adCompany = await AdCompany.deleteById(req.params.id);
    if (!adCompany) return next(new AppError("Company not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Company has been deleted permanently",
    });
  } catch (error) {
    next(error);
  }
};
