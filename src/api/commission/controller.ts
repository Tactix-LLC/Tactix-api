import AppError from "../../utils/app_error";
import Client from "../client/dal";
import IClientDoc from "../client/dto";
import Commission from "./dal";
import { RequestHandler } from "express";

// Create commission
export const createCommission: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const reqBody = <CommissionRequest.ICreateCommissionInput>req.value;

    const loggedInUser = <IClientDoc>req.user; // Logged in user

    // Check agent exists
    const agent = await Client.getClientById(reqBody.agent_id);
    if (!agent) return next(new AppError("Agent does not exist", 400));

    const data: CommissionRequest.ICreateCommissionInput & {
      client_id: string;
    } = {
      client_id: loggedInUser.id,
      agent_id: agent.id,
    };
    // Create commission
    const commission = await Commission.createCommission(data);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { commission },
    });
  } catch (error) {
    next(error);
  }
};

// Get commissions of an agent - for both agents and admins
export const getAgentCommissions: RequestHandler = async (req, res, next) => {
  try {
    const agent_id = req.params.agentId;
    const query = req.query;
    const commissions = await Commission.getAgentCommissions({
      agent_id,
      query,
    });

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: commissions.length,
      data: { commissions },
    });
  } catch (error) {
    next(error);
  }
};

// Get all commissions in DB - for admins
export const getAllCommissions: RequestHandler = async (req, res, next) => {
  try {
    const commissions = await Commission.getAllCommissions(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: commissions.length,
      data: { commissions },
    });
  } catch (error) {
    next(error);
  }
};

// Get one commission by id
export const getCommissionById: RequestHandler = async (req, res, next) => {
  try {
    const commission = await Commission.getCommissionById(req.params.id);
    if (!commission) return next(new AppError("Commission not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { commission },
    });
  } catch (error) {
    next(error);
  }
};

// Delete commission by id
export const deleteCommission: RequestHandler = async (req, res, next) => {
  try {
    const commission = await Commission.deleteCommissionById(req.params.id);
    if (!commission) return next(new AppError("Commission not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Commission deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all commissions
export const deleteAllCommissions: RequestHandler = async (req, res, next) => {
  try {
    await Commission.deleteAllCommissions();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All commissions in DB deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
