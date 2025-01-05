import { RequestHandler } from "express";
import FeedbackTitle from "./dal";
import IFeedbackTitleDoc from "./dto";
import AppError from "../../utils/app_error";
import configs from "../../configs";

// Create feedback title
export const createFeedbackTitle: RequestHandler = async (req, res, next) => {
  try {
    // Request body
    const { title } = <FeedbackTitleRequest.ICreateFeedbackTitleInput>req.value;

    // Check if there are major feedback titles
    const majorTitles = await FeedbackTitle.getAllMajorTitles();

    // Data
    let data: { title: string; major?: boolean } = { title };
    if (majorTitles.length < 3) {
      data = { title, major: true };
    }

    // Insert feedback title
    const feedbackTitle: IFeedbackTitleDoc =
      await FeedbackTitle.createFeedbackTitle(data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "New feedback title created successfully",
      data: {
        feedbackTitle,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find all
export const getAll: RequestHandler = async (req, res, next) => {
  try {
    const feedbackTitles = await FeedbackTitle.getAll();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: feedbackTitles.length,
      data: {
        feedbackTitles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all active feedback titles
export const getAllActiveTitles: RequestHandler = async (req, res, next) => {
  try {
    const feedbackTitles = await FeedbackTitle.getAllActiveTitles();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: feedbackTitles.length,
      data: {
        feedbackTitles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find by id
export const getById: RequestHandler = async (req, res, next) => {
  try {
    // Find title and check if it exists
    const feedbackTitle = await FeedbackTitle.getById(req.params.id);
    if (!feedbackTitle)
      return next(new AppError("feedback title  not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: {
        feedbackTitle,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update title
export const updateFeedbackTitle: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <FeedbackTitleRequest.IUpdateFeedbackTitleInput>req.value;
    const id = req.params.id;

    // Find title and check if it exists
    const checkFeedbackTitle = await FeedbackTitle.getById(req.params.id);
    if (!checkFeedbackTitle)
      return next(new AppError("Feedback title  not found", 404));

    // Update title
    const feedbackTitle = await FeedbackTitle.updateFeedbackTitle(id, data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Feedback title updated successfully",
      data: { feedbackTitle },
    });
  } catch (error) {
    next(error);
  }
};

// Update status
export const changeFeedbackTitleStatus: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Incoming data
    const { status } = <FeedbackTitleRequest.IUpdateFeedbackStatusInput>(
      req.value
    );
    const id = req.params.id;

    // Check feedback title
    const checkFeedbackTitle = await FeedbackTitle.getById(id);
    if (!checkFeedbackTitle)
      return next(new AppError("Feedback title not found", 404));

    // Check if the feedback title is major
    if (checkFeedbackTitle.major) {
      return next(
        new AppError(
          "You can not change the status of major titles. It is Active by default",
          400
        )
      );
    }

    // Check if the status is similar with the current status
    if (checkFeedbackTitle.status === status)
      return next(
        new AppError(
          `There is no need to update the status. It is similar with the current status`,
          400
        )
      );

    // Update feedback title status
    const feedbackTitle = await FeedbackTitle.updateFeedbackTitleStatus(id, {
      status,
    });

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Status of feedback title updated successfully",
      data: { feedbackTitle },
    });
  } catch (error) {
    next(error);
  }
};

// Delete feedback title
export const deleteFeedbackTitle: RequestHandler = async (req, res, next) => {
  try {
    // Check if feedback title  exists
    const feedbackTitle = await FeedbackTitle.getById(req.params.id);
    if (!feedbackTitle)
      return next(new AppError("Feedback title  not found", 404));

    // Check if the feedback title is major
    if (feedbackTitle.major) {
      return next(new AppError("You can not delete major titles.", 400));
    }

    // Delete the feedback title
    await FeedbackTitle.deleteFeedbackTitle(req.params.id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Feedback title deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all feedback title except for major titles
export const deleteAllFeedbackTitles: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Get a delete key
    const { delete_key } = <FeedbackTitleRequest.IDeleteAllFeedbackTitlesInput>(
      req.value
    );

    // Check delete key
    if (configs.delete_key !== delete_key)
      return next(new AppError("Invalid delete key", 400));

    // Delete
    await FeedbackTitle.deleteAllFeedbackTitles();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      messages: "All feedback titles are deleted except for major titles",
    });
  } catch (error) {
    next(error);
  }
};
