import { RequestHandler } from "express";

//DAL
import TransferHistory from "./dal";

//Error
import AppError from "../../utils/app_error";

//Interfaces
import IClientDoc from "../client/dto";

import configs from "../../configs";
import TeamDAL from "../team/dal";

// Add transcation
export const createTransferHistory: RequestHandler = async (req, res, next) => {
  try {
    // Request body
    const transferHistoryData = <
      TransferHistoryRequest.ICreateTransferHistoryInput
    >req.value;

    const user = <IClientDoc>req.user;

    //check team exists
    const team = await TeamDAL.getTeamByIdForAdmin(transferHistoryData.team_id);

    if (!team) {
      return next(new AppError("Team does not exist", 404));
    }

    //organize the data to be inserted
    const data: TransferHistoryRequest.ICreateTransferHistoryInput & {
      client_id: string;
    } = { ...transferHistoryData, client_id: user.id };

    // Insert Transfer history data
    const transferHistory = await TransferHistory.createTransferHistory(data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Trasnfer History Created successfully!",
      data: {
        transferHistory,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get all transfer histories
export const getTransferHistories: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const query = req.query;

    //get the current client transfer History
    const transferHistories = await TransferHistory.getTransferHistories(
      user.id,
      query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: transferHistories.length,
      data: {
        transferHistories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single transfer history record
export const getTransferHistory: RequestHandler = async (req, res, next) => {
  try {
    const transferHistoryId = req.params.id;

    //get a transfer History
    const transferHistory = await TransferHistory.getTransferHistoryById(
      transferHistoryId
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: {
        transferHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all transfer histories
export const getAllTransferHistories: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const query = req.query;
    //get a transfer History
    const transferHistories = await TransferHistory.getAllTransferHistories(
      query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: transferHistories.length,
      data: {
        transferHistories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// delete all transcation records
export const deleteAllTransferHistories: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { deleteKey } = <
      TransferHistoryRequest.IDeleteAllTransferHistoriesInput
    >req.value;

    if (deleteKey !== configs.delete_key) {
      return next(new AppError("Please provide the correct delete key!", 400));
    }

    //delete all transfer Histories
    await TransferHistory.deleteAllTransferHistories();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All transfer history records are deleted successfuly!",
    });
  } catch (error) {
    next(error);
  }
};

// delete a transfer history
export const deleteTransferHistory: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;

    const transferHistory = await TransferHistory.getTransferHistoryById(id);

    if (!transferHistory) {
      return next(new AppError("No transfer history found!", 400));
    }

    //delete all transfer Histories
    await TransferHistory.deleteTransferHistory(id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Transfer History deleted successfuly!",
    });
  } catch (error) {
    next(error);
  }
};

// Transfer bought stat
export const transferStat: RequestHandler = async (req, res, next) => {
  try {
    const stat = await TransferHistory.transferStat();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        stat: {
          boughtStat: stat.boughtStat[0],
          soldStat: stat.soldStat[0],
          transfers: stat.transfers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
