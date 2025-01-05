import Purchase from "./dal";
import AppError from "../../utils/app_error";
import { RequestHandler } from "express";
import configs from "../../configs";

// Get All purchases
export const getAllPurchases: RequestHandler = async (req, res, next) => {
  try {
    const purchases = await Purchase.getAllPurchases(req.query);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: purchases.length,
      data: {
        purchases,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all purchases for a client
export const getPurchasesClient: RequestHandler = async (req, res, next) => {
  try {
    const purchases = await Purchase.getAllPurchasesClient({
      client_id: req.params.client_id,
      query: req.query,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: purchases.length,
      data: {
        purchases,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single purchases
export const getPurchase: RequestHandler = async (req, res, next) => {
  try {
    const purchase = await Purchase.getPurchase(req.params.id);
    if (!purchase) return next(new AppError("Purchase does not exists", 404));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        purchase,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a purchase
export const deletePurchase: RequestHandler = async (req, res, next) => {
  try {
    const purchase = await Purchase.deletePurchase(req.params.id);
    if (!purchase) return next(new AppError("Purchase does not exists", 404));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Purchase deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete purchases of a specific client
export const deletePurchasesClient: RequestHandler = async (req, res, next) => {
  try {
    // Check if there are purchases made by a client
    const purchases = await Purchase.getAllPurchasesClient({
      client_id: req.params.id,
    });
    if (purchases.length === 0)
      return next(
        new AppError(
          "There are no purchases made by the client to delete.",
          400
        )
      );

    // Delete
    await Purchase.deletePurchasesClient(req.params.id);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Purchases successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all purchases
export const deleteAllPurchases: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { delete_key } = <PurchaseRequest.IDeleteAllPurchases>req.value;

    // Check delete key
    if (delete_key !== configs.delete_key)
      return next(new AppError("Invalid delete key", 400));

    // Delete
    await Purchase.deleteAllPurchases();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "All purchases successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};
