import Poll from "./dal";
import { RequestHandler } from "express";
import AppError from "../../utils/app_error";
import configs from "../../configs";
import IClientDoc from "../client/dto";

// Create poll
export const createPoll: RequestHandler = async (req, res, next) => {
  try {
    const data = <PollRequests.ICreateInput>req.value;
    const poll = await Poll.createPol(data);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "New poll created successfully",
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
};

// Get all polls
export const getAll: RequestHandler = async (req, res, next) => {
  try {
    const polls = await Poll.getAll(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: polls.length,
      data: { polls },
    });
  } catch (error) {
    next(error);
  }
};

// Get poll by id
export const getById: RequestHandler = async (req, res, next) => {
  try {
    const poll = await Poll.getById(req.params.pollId);
    if (!poll) return next(new AppError("Poll not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
};

// Update poll detail
export const updatePollInfo: RequestHandler = async (req, res, next) => {
  try {
    const data = <PollRequests.IUpdateInput>req.value;

    const poll = await Poll.updatePollInfo(req.params.pollId, data);
    if (!poll) return next(new AppError("Poll does not exist", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Poll info updated successfully",
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
};

// Update poll status
export const updatePollStatus: RequestHandler = async (req, res, next) => {
  try {
    const data = <PollRequests.IUpdateStatus>req.value;
    const poll = await Poll.updateStatus(req.params.pollId, data.status);
    if (!poll) return next(new AppError("Poll does not exist", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: `Poll status changed to ${data.status}`,
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
};

// Delete all polls
export const deleteAllPolls: RequestHandler = async (req, res, next) => {
  try {
    const delete_key = <PollRequests.IDeleteAll>req.value;

    // Check delete key
    if (configs.delete_key !== delete_key.delete_key) {
      return next(new AppError("Please provide a valid delete key", 400));
    }

    // Delete all polls
    await Poll.deleteAll();

    // Delete all poll responses
    await Poll.deleteAllPollResponses();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All polls have been deleted permanently",
    });
  } catch (error) {
    next(error);
  }
};

// Delete by id
export const deleteByid: RequestHandler = async (req, res, next) => {
  try {
    const poll = await Poll.deleteById(req.params.pollId);
    if (!poll) return next(new AppError("Poll does not exist", 404));

    // Delete poll responses that are linked to this poll
    await Poll.deleteResponsesOfPoll(poll.id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Poll has been deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Create poll response
export const createPollResponse: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <PollResRequests.ICreateInput>req.value;

    // Logged in user
    const user = <IClientDoc>req.user;

    // Check role of the logged in user
    if (user.role !== "Client") {
      return next(
        new AppError("Only clients are allowed to respond to a poll", 400)
      );
    }

    // Check poll exists
    const poll = await Poll.getById(data.poll_id);
    if (!poll) return next(new AppError("Poll does not exist", 404));

    // Check the choice exists in the poll
    const choiceExists = poll.choices.find((choice) => {
      return choice.id === data.choice_id;
    });
    if (!choiceExists) return next(new AppError("Choice does not exist", 400));

    // Check user has already selected their choice
    const userResponse = await Poll.getByPollAndUser(user.id, data.poll_id);
    if (userResponse)
      return next(new AppError("You already have answered this poll", 404));

    data.user_id = user.id; // Add user id to "data"

    // Create poll response
    const pollResponse = await Poll.createPollResponse(data);
    if (!pollResponse)
      return next(
        new AppError("Unable to save your answer. Please try again", 400)
      );

    // Increase the "selected_by" field by 1 and update the "poll" document
    choiceExists.selected_by++;
    await poll.save();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "You've responded successfully",
      data: { pollResponse },
    });
  } catch (error) {
    next(error);
  }
};

// Get clients response for a poll
export const getResponseByUserId: RequestHandler = async (req, res, next) => {
  try {
    const pollResponse = await Poll.getByPollAndUser(
      req.params.userId,
      req.params.pollId
    );
    if (!pollResponse) return next(new AppError("Poll answer not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { pollResponse },
    });
  } catch (error) {
    next(error);
  }
};

// Get all polls a user has participated in
export const getUserPolls: RequestHandler = async (req, res, next) => {
  try {
    const polls = await Poll.getUserPolls(req.params.userId, req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: polls.length,
      data: { polls },
    });
  } catch (error) {
    next(error);
  }
};

// Get all poll responses - for admins
export const getAllPollResponses: RequestHandler = async (req, res, next) => {
  try {
    const pollResponses = await Poll.getAllPollResponses(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: pollResponses.length,
      data: { pollResponses },
    });
  } catch (error) {
    next(error);
  }
};
