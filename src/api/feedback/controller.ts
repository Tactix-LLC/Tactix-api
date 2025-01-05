import { RequestHandler, Response } from "express";
import Feedback from "./dal";
import IFeedbackDoc from "./dto";
import AppError from "../../utils/app_error";
import FeedbackTitle from "../feedback_titles/dal";
import configs from "../../configs";
import IAdminDoc from "../admin/dto";
import sendSms from "../../utils/send_sms";

// Create feedback
export const createFeedback: RequestHandler = async (req, res, next) => {
  try {
    // Request body
    const { title_id, content } = <FeedbackRequest.ICreateFeedkbackInput>(
      req.value
    );

    //check title is valid
    const feedbackTitle = await FeedbackTitle.getById(title_id);
    if (!feedbackTitle) return next(new AppError("No valid title found", 400));

    // Insert feedback
    const feedback: IFeedbackDoc = await Feedback.createFeedback({
      title: feedbackTitle.title,
      content,
    });

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Feedback sent successfully",
      data: {
        feedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find all
export const getAll: RequestHandler = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.getAll(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: feedbacks.length,
      data: {
        feedbacks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find feedback by id
export const getById: RequestHandler = async (req, res, next) => {
  try {
    // Feedback
    let feedback;

    // Find and check if it exists
    const checkFeedback = await Feedback.getById(req.params.id);
    if (!checkFeedback) {
      return next(new AppError("Feedback not found", 404));
    } else {
      feedback = checkFeedback;
    }

    //get the current admin name
    if (!checkFeedback.read_status) {
      const admin = <IAdminDoc>req.user;
      const firstReadBy = admin.first_name + " " + admin.last_name;
      feedback = await Feedback.updateReadStatusAndFirstReadBy({
        id: req.params.id,
        first_read_by: firstReadBy,
      });
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: {
        feedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete feedback
export const deleteFeedback: RequestHandler = async (req, res, next) => {
  try {
    // Check if feedback exists
    const feedback = await Feedback.getById(req.params.id);
    if (!feedback) return next(new AppError("Feedback not found", 404));

    // Delete the feedback
    await Feedback.deleteFeedback(req.params.id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all feedbacks
export const deleteAllFeedbacks: RequestHandler = async (req, res, next) => {
  try {
    // Get delete key
    const { delete_key } = <FeedbackRequest.IDeleteAllFeedbacksInput>req.value;

    // Check if delete key is valid
    if (delete_key !== configs.delete_key) {
      return next(new AppError("Invalid delete key", 400));
    }

    // Delete all
    await Feedback.deleteAllFeedbacks();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "All feedbacks are deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
