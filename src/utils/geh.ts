import { NextFunction, Request, Response } from "express";
import AppError from "./app_error";
import configs from "../configs";

// Send Dev Error
const sendDevError = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    no_client: err.no_client,
    error: err,
    error_stack: err.stack,
  });
};

// Send Prod Error
const sendProdError = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      no_client: err.no_client,
    });
  }
};

export default (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.status = err.status || "ERROR";
  err.statusCode = err.statusCode || 500;

  if (err.message.includes("E11000")) {
    err = new AppError("Duplicate data exists", 400);
  }

  // Cast Error
  if (err.message.includes("Cast to ObjectId")) {
    err = new AppError("Invalid parameter passed", 400);
  }

  // Token Error
  if (err.name === "JsonWebTokenError") {
    err = new AppError("jwt malformed", 400);
  }

  // Token Expired
  if (err.name === "TokenExpiredError") {
    err = new AppError("jwt expired", 400);
  }

  // Send Dev Error or Prod Error
  if (configs.env === "development" || configs.env === "local") {
    sendDevError(err, res);
  } else if (configs.env === "production" || configs.env === "qa") {
    sendProdError(err, res);
  }
};
