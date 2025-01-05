import { RequestHandler } from "express";
import Joi from "joi";
import AppError from "./app_error";

export default (schema: Joi.Schema): RequestHandler => {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body);
    if (error) {
      return next(new AppError(error.message, 400));
    }
    req.value = value;
    next();
  };
};
