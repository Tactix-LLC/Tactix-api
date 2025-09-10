import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import AppError from "./app_error";

const handleValidation: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    return next(new AppError(errorMessages, 400));
  }
  next();
};

export default handleValidation;
