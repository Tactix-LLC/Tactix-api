import Coach from "./dal";
import AppError from "../../utils/app_error";
import { RequestHandler } from "express";
import configs from "../../configs";
import slugifer from "../../utils/slugfier";
import cloudinary from "../../utils/cloudinary";

// Create coach
export const createCoach: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <CoachRequest.ICreateCoachInput>req.value;

    // Check if there is a coach with the name provided
    const slugifiedCoachName = slugifer(data.coach_name);
    const existsingCoach = await Coach.getCoachByName(slugifiedCoachName);
    if (existsingCoach) {
      return next(new AppError("Coach already exists", 400));
    }

    // Get major coaches
    const majorCoaches = await Coach.getMajorCoaches();

    // Data
    let dataOption: {
      coach_name: string;
      coach_slugify_name: string;
      image_public_id: string;
      image_secure_url: string;
      is_major?: boolean;
    } = { ...data, coach_slugify_name: slugifiedCoachName };

    //create a non major coach if there are already three major coaches
    if (majorCoaches.length < 3) {
      dataOption.is_major = true;
    }

    const newCoach = await Coach.createCoach(dataOption);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Coach created successfully.",
      data: {
        coach: newCoach,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get coach by id
export const getCoach: RequestHandler = async (req, res, next) => {
  try {
    // Find coaches by id
    const coach = await Coach.getCoachById(req.params.id);
    if (!coach)
      return next(new AppError("There is no coach with the specified ID", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { coach },
    });
  } catch (error) {
    next(error);
  }
};

// Get coach by name
export const getCoachByName: RequestHandler = async (req, res, next) => {
  try {
    // Find coaches by id
    const coach = await Coach.getCoachByName(slugifer(req.params.name));

    if (!coach) {
      return next(new AppError("Coach does not exist", 404));
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { coach },
    });
  } catch (error) {
    next(error);
  }
};

// Get coach
export const getCoaches: RequestHandler = async (req, res, next) => {
  try {
    // get all coaches that are active
    const coaches = await Coach.getCoaches();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: coaches.length,
      data: { coaches },
    });
  } catch (error) {
    next(error);
  }
};

// Get all coaches both active and in active
export const getAllCoaches: RequestHandler = async (req, res, next) => {
  try {
    const coaches = await Coach.getAllCoaches();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: coaches.length,
      data: {
        coaches,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update a coach
export const updateCoach: RequestHandler = async (req, res, next) => {
  try {
    const data = <CoachRequest.IUpdateCoachInfoInput>req.value;
    const id = req.params.id;

    const slugifiedCoachName = slugifer(data.coach_name);
    const checkCoach = await Coach.getCoachByName(slugifiedCoachName);
    if (checkCoach)
      return next(
        new AppError("The coach name already exists. Change it", 400)
      );

    //update a coach
    const coach = await Coach.updateCoachInfo(id, {
      coach_slugify_name: slugifiedCoachName,
      ...data,
    });

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Coach updated successfuly",
      data: { coach },
    });
  } catch (error) {
    next(error);
  }
};

// Update a coach image
export const updateCoachImage: RequestHandler = async (req, res, next) => {
  try {
    const data = <CoachRequest.IUpdateCoachImageInput>req.value;
    const id = req.params.id;

    const existsingCoach = await Coach.getCoachById(id);

    if (!existsingCoach) {
      return next(new AppError("Coach does not exist", 404));
    }

    //update a coach image
    const coach = await Coach.updateCoachImage(id, data);

    // Destory previous image
    if (existsingCoach.image_public_id || existsingCoach.image_secure_url) {
      await cloudinary.v2.uploader.destroy(existsingCoach.image_public_id);
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Coach image updated successfuly.",
      data: { coach },
    });
  } catch (error) {
    next(error);
  }
};

// Swap major coach
export const swapMajorCoach: RequestHandler = async (req, res, next) => {
  try {
    const data = <CoachRequest.ISwapMajorCoachInput>req.value;

    //check existing MAJOR coach exists
    const majorCoach = await Coach.getCoachById(data.existingCoachId);
    const newCoach = await Coach.getCoachById(data.newMajorCoachId);

    //check if major coach exists
    if (!majorCoach) {
      return next(new AppError("Selected major coach does not exist.", 404));
    }

    //check if the new coach exists
    if (!newCoach) {
      return next(new AppError("The new major coach does not exist.", 404));
    }

    //check if the new caoch is already a major coach
    if (newCoach.is_major) {
      return next(
        new AppError(
          `Since the new selected major coach is already a major coach you can not perform swap action.`,
          400
        )
      );
    }

    //check if the major coach is actually a major coach
    if (!majorCoach.is_major) {
      return next(
        new AppError(
          `Please select the correct major coach to be swapped.`,
          400
        )
      );
    }

    //swap a coach by a new coah
    await Coach.swapMajorCoach(data);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Major coach swapped successfuly",
    });
  } catch (error) {
    next(error);
  }
};

// Update a coach status
export const updateCoachStatus: RequestHandler = async (req, res, next) => {
  try {
    const data = <CoachRequest.IUpdateStatusOfCoachInput>req.value;
    const id = req.params.id;

    const existingCoach = await Coach.getCoachById(id);

    if (!existingCoach) {
      return next(new AppError("Coach does not exist", 404));
    }

    if (existingCoach.is_major) {
      return next(
        new AppError("Changing major coach status is not allowed.", 400)
      );
    }

    // Check if the current status is similar with the one being requested
    if (data.is_active === existingCoach.is_active)
      return next(
        new AppError(
          `There is no need to update the status. It is similar with the current status`,
          400
        )
      );

    //update a coach
    const coach = await Coach.updateCoachStatus(id, data);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { coach },
    });
  } catch (error) {
    next(error);
  }
};

// delete a coach
export const deleteCoach: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;

    const coach = await Coach.getCoachById(id);

    if (!coach) {
      return next(new AppError("Coach does not exist", 404));
    }

    if (coach.is_major) {
      return next(new AppError("Major coaches can not be deleted!", 400));
    }

    //delete a coach
    await Coach.deleteCoach(id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Coach deleted successfuly.",
    });
  } catch (error) {
    next(error);
  }
};

// delete all coaches
export const deleteAllCoaches: RequestHandler = async (req, res, next) => {
  try {
    const { deleteKey } = <CoachRequest.IDeleteAllCoachesInput>req.value;

    if (deleteKey !== configs.delete_key) {
      return next(new AppError("Please provide the correct API key,", 400));
    }

    //delete all coaches
    await Coach.deleteAllCoaches();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All non-major coaches are deleted successfuly.",
    });
  } catch (error) {
    next(error);
  }
};
