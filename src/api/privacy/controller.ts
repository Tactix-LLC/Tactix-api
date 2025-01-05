import { RequestHandler } from "express";

//Data Access Layer
import Privacy from "./dal";

//Data Transfer Object
import IPrivacyDoc from "./dto";

//Error handler
import AppError from "../../utils/app_error";

// Configs
import configs from "../../configs";

//create Privacy
export const createPrivacy: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { title, content, is_message, is_published } = <
      PrivacyRequest.ICreatePrivacyInput
    >req.value;

    // Check if there is_message content
    if (is_message) {
      // Get privacy
      const message = await Privacy.filterPrivaciesByIsMessage();
      if (message)
        return next(
          new AppError(
            "There is already a privacy message. Please use the update feature",
            403
          )
        );
    }

    // create Privacy
    const privacy = await Privacy.createPrivacy({
      title,
      content,
      is_message,
      is_published,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "New privacy is successfully created",
      data: {
        privacy,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get All Privacies
export const getPrivacies: RequestHandler = async (req, res, next) => {
  try {
    // create Privacy
    const privacy = await Privacy.getPrivacies(req.query);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        privacy,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get All Privacies
export const getAllPrivacies: RequestHandler = async (req, res, next) => {
  try {
    // create Privacy
    const privacy = await Privacy.getAllPrivacies(req.query);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        privacy,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get a single Privacy
export const getPrivacyById: RequestHandler = async (req, res, next) => {
  try {
    // create Privacy
    const privacy = await Privacy.getPrivacyById(req.params.id);
    if (!privacy) return next(new AppError("No Privacy Found!", 400));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        privacy,
      },
    });
  } catch (error) {
    next(error);
  }
};

//update published Privacy status
export const updatePublishedStatus: RequestHandler = async (req, res, next) => {
  try {
    const { status } = <PrivacyRequest.IUpdatePrivacyByStatusInput>req.value;

    // update Privacy status
    const privacy = await Privacy.updatePublishedStatus({
      id: req.params.id,
      status,
    });
    if (!privacy) return next(new AppError("No Privacy Found!", 400));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        privacy,
      },
    });
  } catch (error) {
    next(error);
  }
};

//update single Privacy
export const updateSinglePrivacy: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { title, content } = <PrivacyRequest.IUpdatePrivacyInput>req.value;

    // update Privacy
    const privacy = await Privacy.updatePrivacy({
      id: req.params.id,
      title,
      content,
    });
    if (!privacy) return next(new AppError("No Privacy Found!", 400));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        privacy,
      },
    });
  } catch (error) {
    next(error);
  }
};

//delete single Privacy
export const deletePrivacy: RequestHandler = async (req, res, next) => {
  try {
    // delete Privacy
    const privacy = await Privacy.deleteSinglePrivacy(req.params.id);
    if (!privacy) return next(new AppError("No Privacy Found!", 400));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Privacy Deleted Successfuly",
    });
  } catch (error) {
    next(error);
  }
};

//delete All Privacies
export const deletePrivacies: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { delete_key } = <PrivacyRequest.IDeleteAllPrivacies>req.value;

    // Check delete key
    if (delete_key !== configs.delete_key)
      return next(new AppError("Invalid delete key", 400));

    // delete Privacy
    await Privacy.deletePrivacies();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "privacies Deleted Successfuly",
    });
  } catch (error) {
    next(error);
  }
};
