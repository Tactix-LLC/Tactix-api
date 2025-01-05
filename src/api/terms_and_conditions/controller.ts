import { RequestHandler } from "express";
import TermsAndConditions from "./dal";
import AppError from "../../utils/app_error";
import configs from "../../configs";

// Create terms and conditions
export const createTerms: RequestHandler = async (req, res, next) => {
  try {
    // First check
    // Incoming data
    const { title, content, is_published, is_message } = <
      TermsRequest.ICreateTermsInput
    >req.value;

    // Check if there is_message
    if (is_message) {
      // Get is message terms and conditions
      const message = await TermsAndConditions.getIsMessageTerms();
      if (message)
        return next(
          new AppError(
            "There is already a terms and conditions message. Please use the update feature",
            403
          )
        );
    }

    // Create terms and conditions
    const termsAndConditions = await TermsAndConditions.createTerms({
      title,
      content,
      is_published,
      is_message,
    });

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Terms and conditions created successfully",
      data: {
        termsAndConditions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find all terms and conditions
export const getAllTerms: RequestHandler = async (req, res, next) => {
  try {
    const termsAndConditions = await TermsAndConditions.getAllTerms(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: termsAndConditions.length,
      data: {
        termsAndConditions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find all terms and conditions
export const getAllPublishedTerms: RequestHandler = async (req, res, next) => {
  try {
    const termsAndConditions = await TermsAndConditions.getAllPublishedTerms(
      req.query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: termsAndConditions.length,
      data: {
        termsAndConditions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find one by id
export const getTermById: RequestHandler = async (req, res, next) => {
  try {
    // Find terms-and-conditions using an id and check it exists
    const termsAndConditions = await TermsAndConditions.getTermById(
      req.params.id
    );
    if (!termsAndConditions)
      return next(new AppError("No terms and conditions data found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: {
        termsAndConditions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update terms detail
export const updateTermsDetail: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const { title, content, is_published } = <TermsRequest.IUpdateTermsInput>req.value;

    // Update terms and conditions data
    const termsAndConditions = await TermsAndConditions.updateTerms({
      id: req.params.id,
      title,
      content,
      is_published
    });
    if (!termsAndConditions)
      return next(new AppError("No terms and conditions data found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Terms and conditions updated successfully",
      data: { termsAndConditions },
    });
  } catch (error) {
    next(error);
  }
};

//update published Privacy status
export const updatePublishedStatus: RequestHandler = async (req, res, next) => {
  try {
    const { status } = <TermsRequest.IUpdateTermStatusInput>req.value;

    // update Privacy status
    const terms = await TermsAndConditions.updatePublishedStatus({
      id: req.params.id,
      status,
    });
    if (!terms) return next(new AppError("No Terms & Conditions Found!", 400));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        terms,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete terms-and-conditions by id
export const deleteTermById: RequestHandler = async (req, res, next) => {
  try {
    // Check terms exist
    const terms = await TermsAndConditions.deleteTerm(req.params.id);
    if (!terms)
      return next(new AppError("No terms-and-conditions data found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "A single terms-and-conditions is deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all terms and conditions
export const deleteAllTerms: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { delete_key } = <TermsRequest.IDeleteAllTermsInput>req.value;

    // Check delete key
    if (delete_key !== configs.delete_key)
      return next(new AppError("Invalid delete key", 400));

    // Delete
    await TermsAndConditions.deleteAllTerms();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All terms and conditions are deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
