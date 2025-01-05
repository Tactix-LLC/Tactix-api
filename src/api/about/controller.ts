import { RequestHandler } from "express";
import AboutUs from "./dal";
import IAboutUsDoc from "./dto";
import AppError from "../../utils/app_error";

// Create about-us
export const createAboutUs: RequestHandler = async (req, res, next) => {
  try {
    // Request body
    const data = <AboutUsRequest.IAboutUsInput>req.value;

    // Check if there is an existing about us content
    const aboutUs = await AboutUs.getAll();
    if (aboutUs.length > 0) {
      return next(
        new AppError(
          "There is an existing about us content. Use the update feature",
          400
        )
      );
    }

    // Insert about-us content
    const newAboutUs: IAboutUsDoc = await AboutUs.createAboutUs(data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "New About-Us content created successfully",
      data: {
        aboutUs: newAboutUs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find all
export const getAll: RequestHandler = async (req, res, next) => {
  try {
    const aboutUs = await AboutUs.getAll();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: aboutUs.length,
      data: {
        aboutUs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find all
export const getEveryAboutUs: RequestHandler = async (req, res, next) => {
  try {
    const aboutUs = await AboutUs.getEveryAboutUs();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: aboutUs.length,
      data: {
        aboutUs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find by id
export const getById: RequestHandler = async (req, res, next) => {
  try {
    // Find content and check if it exists
    const aboutUs = await AboutUs.getById(req.params.id);
    if (!aboutUs) return next(new AppError("About-Us content not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: {
        aboutUs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update content
export const updateContent: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AboutUsRequest.IUpdateAboutUsInput>req.value;
    const id = req.params.id;

    // Update content. Also check if the dal method returns null
    const aboutUs = await AboutUs.updateContent(id, data);
    if (!aboutUs) return next(new AppError("About-Us content not found", 404));

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "About-Us content updated successfully",
      data: { aboutUs },
    });
  } catch (error) {
    next(error);
  }
};

// Update status
export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AboutUsRequest.IUpdateAboutUsStatusInput>req.value;
    const id = req.params.id;

    // Find content and check if it exists
    const checkAboutUs = await AboutUs.getById(id);
    if (!checkAboutUs)
      return next(new AppError("About-Us content not found", 404));

    // Check if the current status is similar with the one being requested

    if (data.is_active === checkAboutUs.is_active)
      return next(
        new AppError(
          `There is no need to update the status. It is similar with the current status`,
          400
        )
      );

    // Update about-us. Also check if the dal method returns null
    const aboutUs = await AboutUs.updateStatus(id, data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Status of about-us content updated successfully",
      data: { aboutUs },
    });
  } catch (error) {
    next(error);
  }
};

// Delete about-us
export const deleteAboutUs: RequestHandler = async (req, res, next) => {
  try {
    // Check if about-us content exists
    const aboutUs = await AboutUs.getById(req.params.id);
    if (!aboutUs) return next(new AppError("About-Us content not found", 404));

    // Delete the about-us content
    await AboutUs.deleteAboutUs(req.params.id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "About-Us content deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
