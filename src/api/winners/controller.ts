import Winners from "./dal";
import { RequestHandler } from "express";
import AppError from "../../utils/app_error";
import Client from "../client/dal";
import GameWeekDAL from "../game_week/dal";
import Season from "../season/dal";
import TeamDAL from "../team/dal";
import GameWeekTeamDAL from "../game_week_team/dal";
import IClientDoc from "../client/dto";

// Create winner
export const createWinner: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <WinnersRequest.ICreateWinnerInput>req.value;

    // Check winner client exists in db
    const winnerClient = await Client.getClientById(data.client_id);
    if (!winnerClient) return next(new AppError("Winner does not exist", 404));

    // Check game week exists
    if (data.game_week_id && data.weekly_monthly_yearly === "Weekly") {
      const gameWeek = await GameWeekDAL.getGameWeekById(data.game_week_id);
      if (!gameWeek) return next(new AppError("Gameweek does not exist", 404));

      // If client is weekly winner, check client has joined game_week_team
      const clientGameWeekTeam = await GameWeekTeamDAL.getByGameWeekAndClientId(
        { client_id: data.client_id, game_week_id: data.game_week_id }
      );
      if (!clientGameWeekTeam) {
        return next(new AppError("Client has not joined this game week", 400));
      }
      data.total_fantasy_point = clientGameWeekTeam.total_fantasy_point;
    }

    // If request is for yearly winner
    if (data.weekly_monthly_yearly === "Yearly") {
      const clientTeam = await TeamDAL.getClientTeams(winnerClient.id);
      if (!clientTeam) {
        return next(new AppError("Client does not have team", 400));
      }
      data.total_fantasy_point = clientTeam.total_fantasy_point;
    }

    // Check season exists
    const season = await Season.getSeasonBySid(data.season);
    if (!season) return next(new AppError("Season does not exist", 404));

    // Create winner
    const winner = await Winners.createWinner(data);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { winner },
    });
  } catch (error) {
    next(error);
  }
};

// Approve winner
export const approveWinner: RequestHandler = async (req, res, next) => {
  try {
    // Check prize is already approved
    const winnerDoc = await Winners.getWinnerById(req.params.id);
    if (!winnerDoc) return next(new AppError("Winner not found", 404));
    if (winnerDoc.is_approved === true)
      return next(new AppError("Prize already approved", 400));

    // Approve winner's prize
    const winner = await Winners.approveWinner(req.params.id);
    if (!winner) return next(new AppError("Winner not found", 404));

    // Find client
    const client = await Client.getClientById(winner.client_id);
    if (!client) return next(new AppError("Client not found", 404));

    // Put necessary data for the update in one object
    let clientData: ClientRequest.IUpdatePrize;

    // If prize is for credit, only update client's credit
    if (winnerDoc.is_credit) {
      clientData = {
        client_id: client._id,
        prize_balance: client.prize_balance,
        earned_prize: client.earned_prize + winner.prize,
      };

      // Update clients credit
      await Client.updateClientCredit({
        amount: client.credit + winner.prize,
        id: client.id,
      });
    } else {
      clientData = {
        client_id: client._id,
        prize_balance: client.prize_balance + winner.prize,
        earned_prize: client.earned_prize + winner.prize,
      };
    }

    // Update client's prize
    await Client.updateEarnedPrizeAndPrizeBalance(clientData);

    // Response
    return res.status(200).json({
      status: "SUCCESS",
      message: "Winner prize approved successfully",
      data: { winner },
    });
  } catch (error) {
    throw error;
  }
};

// Get all winners
export const getAllWinners: RequestHandler = async (req, res, next) => {
  try {
    const winners = await Winners.getAllWinners();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: winners.length,
      data: { winners },
    });
  } catch (error) {
    next(error);
  }
};

// Get winners in a game week
export const getWeeklyWinners: RequestHandler = async (req, res, next) => {
  try {
    const weeklyWinners = await Winners.getWeeklyWinners(req.params.gameWeekId);

    // Get weekly point of client's team

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: weeklyWinners.length,
      data: { weeklyWinners },
    });
  } catch (error) {
    next(error);
  }
};

// Get winners in a year/season - for mobile
export const getYearlyWinners: RequestHandler = async (req, res, next) => {
  try {
    // Get currently active season/year
    const season = await Season.getAll();

    // Get winners in the active year/season
    const yearlyWinners = await Winners.getYearlyWinners(
      season[0].name,
      req.query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: yearlyWinners.length,
      data: { yearlyWinners },
    });
  } catch (error) {
    next(error);
  }
};

// Update
export const updateWinnerPrize: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <WinnersRequest.ICreateWinnerInput>req.value;
    const winnerId = req.params.winnerId;
    const winner = await Winners.updatePrize(winnerId, data.prize);
    if (!winner) return next(new AppError("Winner not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Winner prize updated successfully",
      data: { winner },
    });
  } catch (error) {
    next(error);
  }
};

// Get awards of a client - for admins
export const getClientAwards: RequestHandler = async (req, res, next) => {
  try {
    const clientAwards = await Winners.getClientAwards(req.params.clientId);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: clientAwards.length,
      data: { clientAwards },
    });
  } catch (error) {
    next(error);
  }
};

// Delete winner
export const deleteWinner: RequestHandler = async (req, res, next) => {
  try {
    const winner = await Winners.deleteWinner(req.params.winnerId);
    if (!winner) return next(new AppError("Winner not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Winner deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all winners in DB
export const deleteAllWinners: RequestHandler = async (req, res, next) => {
  try {
    await Winners.deleteAllWinners();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All winners in DB delete successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly winners
export const getMonthlyWinners: RequestHandler = async (req, res, next) => {
  try {
    const month = req.query.month as string;
    const monthlyWinners = await Winners.getMonthlyWinners(month);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: monthlyWinners.length,
      data: { monthlyWinners },
    });
  } catch (error) {
    next(error);
  }
};

// Update "is_credit"
export const updateIsCredit: RequestHandler = async (req, res, next) => {
  try {
    const data = <WinnersRequest.IUpdateIsCredit>req.value;

    const winner = await Winners.updateIsCredit(
      req.params.winnerId,
      data.is_credit
    );
    if (!winner) return next(new AppError("Winner not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Winner prize data updated",
      data: { winner },
    });
  } catch (error) {
    next(error);
  }
};
