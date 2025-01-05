import { RequestHandler } from "express";

//DAL
import Transaction from "./dal";

//Error
import AppError from "../../utils/app_error";

//Interfaces
import IClientDoc from "../client/dto";

import configs from "../../configs";

// Add transcation
export const createTransaction: RequestHandler = async (req, res, next) => {
  try {
    // Request body
    const transactionData =
      req.value as unknown as TransactionRequest.ICreateTransactionInput;

    const user = <IClientDoc>req.user;

    const data: TransactionRequest.ICreateTransactionInput & {
      client_id: string;
    } = { ...transactionData, client_id: user.id };

    // Insert Transaction data
    const transaction = await Transaction.createTransaction(data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Transcation Added successfully!",
      data: {
        transaction,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get all transcations of a player
export const getTranscations: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const query = req.query;

    //get the current client transaction
    const transactions = await Transaction.getTranscations(user.id, query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: transactions.length,
      data: {
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single transcation record
export const getTranscation: RequestHandler = async (req, res, next) => {
  try {
    const transactionId = req.params.id;

    //get a transaction
    const transactions = await Transaction.getTransactionById(transactionId);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: transactions.length,
      data: {
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get every single transcation record
export const getEveryTransactions: RequestHandler = async (req, res, next) => {
  try {
    const query = req.query;
    //get a transaction
    const transactions = await Transaction.getEveryTransactions(query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: transactions.length,
      data: {
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// delete all transcation records
export const deleteAllTransactions: RequestHandler = async (req, res, next) => {
  try {
    const { deleteKey } = <TransactionRequest.IDeleteAllTransactionsInput>(
      req.value
    );

    if (deleteKey !== configs.delete_key) {
      return next(new AppError("Please provide the correct delete key!", 400));
    }

    //delete all transactions
    await Transaction.deleteAllTransactions();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All transaction records are deleted successfuly!",
    });
  } catch (error) {
    next(error);
  }
};

// delete a transcation records
export const deleteTransaction: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;

    const transaction = await Transaction.getTransactionById(id);

    if (!transaction) {
      return next(new AppError("No transaction record found!", 400));
    }

    //delete all transactions
    await Transaction.deleteTransaction(id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Transaction record deleted successfuly!",
    });
  } catch (error) {
    next(error);
  }
};

// Get client transaction - for admins
export const getClientTransactions: RequestHandler = async (req, res, next) => {
  try {
    const clientTransactions = await Transaction.getTranscations(
      req.params.clientId
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: clientTransactions.length,
      data: { clientTransactions },
    });
  } catch (error) {
    next(error);
  }
};
