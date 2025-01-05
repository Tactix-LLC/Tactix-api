import { RequestHandler } from "express";
import DashBoard from "./dal";

// Get number of clients who joined each game week
export const getClientsJoinedInEachGameWeek: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const joinedCients = await DashBoard.clientsJoinedInEachGameWeek();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { joinedCients },
    });
  } catch (err) {
    next(err);
  }
};

// Get number of clients that played in each month
export const getClientsThatPlayedInEachMonth: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const clientsPlayedInEachMonth = await DashBoard.clientsPlayedInEachMonth();

    // Response
    res.status(200).json({
      status: 200,
      data: { clientsPlayedInEachMonth },
    });
  } catch (error) {
    next(error);
  }
};

// Get number of clients that signed up each month
export const getClientSignUpInEachMont: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const clientsSignUp = await DashBoard.clientsSignedUpEachMonth();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { clientsSignUp },
    });
  } catch (error) {
    next(error);
  }
};

// Get number of clients that joined free and paid game weeks
export const getClientsInPaidAndFreeGameWeeks: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const numberOflients = await DashBoard.clientsJoinedFreeAndPaidGameWeek();

    res.status(200).json({
      status: "SUCCESS",
      data: { numberOflients },
    });
  } catch (error) {
    next(error);
  }
};

// Get all analytics
export const getAnalytics: RequestHandler = async (req, res, next) => {
  try {
    // Clients joined in each game week
    const clientsJoinedInEachWeek =
      await DashBoard.clientsJoinedInEachGameWeek();

    // Clients that played in each month
    const clientsPlayedInEachMonth = await DashBoard.clientsPlayedInEachMonth();

    // Number of clients who signed up in each month
    const signedUpClients = await DashBoard.clientsSignedUpEachMonth();

    // Number of clients who joined free and paid game weeks
    const clientsInFreeAndPaidGameWeeks =
      await DashBoard.clientsJoinedFreeAndPaidGameWeek();

    // Get agents by status
    const agentRequests = await DashBoard.agentRequestsByStatus();

    // Number of times a coach is selected as favorite
    const favoriteCoaches = await DashBoard.favoriteCoaches();

    // Agent commission
    const agentsCommission =
      await DashBoard.totalCommissionOfEachAgentOfAllTime(req.query);

    const agentsCommissionInYear = await DashBoard.commissionOfEachAgentInYear(
      req.query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: {
        signedUpClients,
        clientsJoinedInEachWeek,
        clientsInFreeAndPaidGameWeeks,
        clientsPlayedInEachMonth,
        agentRequests,
        favoriteCoaches,
        agentsCommission,
        agentsCommissionInYear,
      },
    });
  } catch (error) {
    next(error);
  }
};
