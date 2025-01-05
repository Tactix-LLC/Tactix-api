import AppError from "../../utils/app_error";
import { RequestHandler } from "express";
import GameWeekTeam from "./dal";
import GameWeek from "../game_week/dal";
import IClientDoc from "../client/dto";
import TeamDAL from "../team/dal";
import GameWeekDAL from "../game_week/dal";
import CompetitionDAL from "../competition/dal";
import GameWeekTeamDAL from "./dal";
import configs from "../../configs";
import ITeamDoc, { IPlayersData } from "../team/dto";
import Client from "../client/dal";
import Purchase from "../purchase/dal";
import CommissionDAL from "../commission/dal";
import Transaction from "../transaction/dal";
import IGameWeekTeamDoc from "./dto";
import player_stats from "../team/utils/player_stats";
import calculate_fantasy_points from "../team/utils/calculate_fantasy_points";
import live_rank from "./utils/live_rank";
import send_sms from "../../utils/send_sms";

// Create game-week-team
export const joinGameWeek: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const { cid } = <IGameWeekTeamRequest.ICreateGameWeekTeamInput>req.value;

    // Get id of the logged in user
    const user = <IClientDoc>req.user;

    // Find the active game week
    const gameWeek = await GameWeekDAL.getLiveGameWeek();
    if (!gameWeek)
      return next(new AppError("There's no active game week", 400));

    // Check client hasn't joined the game_week yet
    const clientGameWeek = await GameWeekTeam.getByGameWeekAndClientId({
      client_id: user.id,
      game_week_id: gameWeek.id,
    });
    if (clientGameWeek) {
      return next(
        new AppError(
          "You already have joined the current active game week",
          400
        )
      );
    }

    // Check purchase_deadline of the current game weeks hasn't passed
    const purchaseDeadline = gameWeek.purchase_deadline.getTime();
    if (purchaseDeadline < new Date(Date.now()).getTime()) {
      return next(
        new AppError("The deadline to join this week has passed", 400)
      );
    }

    if (!gameWeek.is_free) {
      // Check client's credit
      if (user.credit < 45 && user.gameweek_package <= 0)
        return next(
          new AppError(
            "Low credit or No Package. Sorry! You can not join this game week",
            400
          )
        );
    }

    // Check team exists and has 15 players
    const clientTeam = await TeamDAL.getClientTeams(user.id);
    if (
      !clientTeam ||
      !Array.isArray(clientTeam.players) ||
      clientTeam.players.length < 15
    )
      return next(new AppError("You haven't created a team yet", 400));

    // Check competition
    const competition = await CompetitionDAL.getCompetition(cid);
    if (!competition)
      return next(new AppError("Unknown competition selected", 400));

    // Put necessary info in one object
    const data: IGameWeekTeamRequest.ICreateGameWeekTeamInput & {
      client_id: string;
      team_id: string;
      game_week_id: string;
      players: Array<IPlayersData>;
    } = {
      client_id: user.id,
      team_id: clientTeam.id,
      cid,
      players: clientTeam.players,
      game_week_id: gameWeek.id,
    };

    // Create game week team
    const gameWeekTeam = await GameWeekTeam.createGameWeekTeam(data);

    // If game week is not free, deduct from their credit. Else, let them join the game week
    if (gameWeekTeam) {
      if (!gameWeek.is_free) {
        // Check if client has game week packages available for joining
        if (user.gameweek_package > 0) {
          // Deduct from gameweek packages
          const latestGameweekPackage = user.gameweek_package - 1;
          const client = await Client.updateGameweekPackage({
            id: user._id,
            gameweeks: latestGameweekPackage,
          });
          if (client) {
            // Create purchase
            await Purchase.createPurchase({
              client_id: user._id,
              game_week: gameWeek.game_week,
              team_name: clientTeam?.team_name,
              is_package: true,
            });
          } else {
            await GameWeekTeam.deleteGameWeekTeamById(gameWeekTeam._id);
            return next(
              new AppError(
                "Opps!! Unable to update your credit. Please try again",
                400
              )
            );
          }
        } else {
          // deduct from user's client
          const latestCreditAmount = user.credit - 45;
          const client = await Client.updateClientCredit({
            amount: latestCreditAmount,
            id: user._id,
          });
          if (client) {
            // Create purchase
            await Purchase.createPurchase({
              client_id: user._id,
              game_week: gameWeek.game_week,
              team_name: clientTeam?.team_name,
            });
          } else {
            await GameWeekTeam.deleteGameWeekTeamById(gameWeekTeam._id);
            return next(
              new AppError(
                "Opps!! Unable to update your credit. Please try again",
                400
              )
            );
          }
        }
      } else {
        await Purchase.createPurchase({
          client_id: user._id,
          game_week: gameWeek.game_week,
          team_name: clientTeam?.team_name,
          amount: 0,
        });
      }

      if (user.ref_agent_code) {
        // If client has joined 2 game weeks, create commission
        const clientGameWeekTeams = await GameWeekTeam.getClientGameWeekTeams(
          user.id
        );

        // The agent that refered this logged in user
        const agent = await Client.getClientByAgentCode(user.ref_agent_code);
        if (agent) {
          if (clientGameWeekTeams.length === 1) {
            // Create commission
            await CommissionDAL.createCommission({
              client_id: user.id,
              agent_id: agent?.id,
            });

            // Update commission balance of agent
            let earnedCommission: number = 0;
            let availableCommission: number = 0;
            if (agent.earned_commission) {
              earnedCommission = agent.earned_commission + 25;
              availableCommission = agent.commission_balance + 25;
            } else {
              earnedCommission = 25;
              availableCommission = 25;
            }
            await Client.updateEarnedAvailableCommission({
              agent_id: agent.id,
              earnedCommission,
              availableCommission,
            });
          }
        }
      }

      // Send SMS
      send_sms(res, {
        message: `ውድ የሎጬ ቤተሰብ ${gameWeek.game_week}ኛውን ሳምንት ስለተቀላቀሉ እናመሰግናለን፡፡ መልካም እድል፡፡`,

        phone_number: user.phone_number,
        response_message: "Thank you message sent successfully",
      });

      // Response
      res.status(201).json({
        status: "SUCCESS",
        message: "You have joined the current game week",
        data: { gameWeekTeam },
      });
    } else {
      return next(
        new AppError(
          "Opps!! Unable to join this game week. Please try again later.",
          400
        )
      );
    }
  } catch (error) {
    next(error);
  }
};

// Check client has joined the current active game week
export const checkClientJoinedActiveGameWeek: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Logged in client
    const client = <IClientDoc>req.user;
    let lowBalance = true;
    let no_package = true;
    if (client.credit >= 45) {
      lowBalance = false;
    }

    // Check user has package
    if (client.gameweek_package >= 1) {
      no_package = false;
    }

    // Currently active game week
    const activeGameWeek = await GameWeekDAL.getLiveGameWeek();
    if (!activeGameWeek) {
      return res.status(200).json({
        status: "SUCCESS",
        data: {
          clientGameWeekTeam: null,
          activeGameWeekAvailable: false,
          deadlinePassed: true,
          isGameWeekFree: false,
          lowBalance,
          no_package,
        },
      });
    }

    // Get game_week_team by game week and client id
    const clientGameWeekTeam = await GameWeekTeam.getByGameWeekAndClientId({
      client_id: client.id,
      game_week_id: activeGameWeek.id,
    });

    // Send response based for d/t scenarios
    if (
      !clientGameWeekTeam &&
      activeGameWeek.purchase_deadline < new Date(Date.now())
    ) {
      return res.status(200).json({
        status: "SUCCESS",
        data: {
          clientGameWeekTeam: null,
          activeGameWeekAvailable: true,
          deadlinePassed: true,
          isGameWeekFree: activeGameWeek.is_free,
          lowBalance,
          no_package,
        },
      });
    } else if (
      clientGameWeekTeam &&
      activeGameWeek.purchase_deadline < new Date(Date.now())
    ) {
      return res.status(200).json({
        status: "SUCCESS",
        data: {
          clientGameWeekTeam,
          activeGameWeekAvailable: true,
          deadlinePassed: true,
          isGameWeekFree: activeGameWeek.is_free,
          lowBalance,
          no_package,
        },
      });
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: {
        clientGameWeekTeam,
        activeGameWeekAvailable: true,
        deadlinePassed: false,
        isGameWeekFree: activeGameWeek.is_free,
        lowBalance,
        no_package,
      },
    });
  } catch (error) {
    next(error);
  }
};

//get a game week team doc
export const getGameWeekTeam: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    const gameWeekTeam = await GameWeekTeam.getGameWeekTeamById(id);

    if (!gameWeekTeam) {
      return next(new AppError("No game week team found", 404));
    }

    //Respoonse
    res.status(200).json({
      status: "SUCCESS",
      data: { gameWeekTeam },
    });
  } catch (err) {
    next(err);
  }
};

//get a game week teams
export const getAllGameWeekTeams: RequestHandler = async (req, res, next) => {
  try {
    const gameWeekTeam = await GameWeekTeam.getAllGameWeekTeams(req.query);

    if (gameWeekTeam.length === 0) {
      return next(new AppError("No game week team found", 404));
    }

    //Respoonse
    res.status(200).json({
      status: "SUCCESS",
      results: gameWeekTeam.length,
      data: { gameWeekTeam },
    });
  } catch (err) {
    next(err);
  }
};

// Get a game_week_team by client id and game_week
export const getByGameWeekAndClientId: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const gameWeekId = req.params.gameweekid;
    const user = <IClientDoc>req.user;

    const gameWeekIsActive = await GameWeekDAL.getGameWeekById(gameWeekId);

    if (!gameWeekIsActive) {
      return next(new AppError("Game week not found", 404));
    }

    const gameWeek = await GameWeekTeam.getByGameWeekAndClientId({
      client_id: user._id,
      game_week_id: gameWeekId,
    });

    if (!gameWeek) {
      return next(new AppError("No game week found", 404));
    }

    //Respoonse
    res.status(200).json({
      status: "SUCCESS",
      data: { gameWeek },
    });
  } catch (err) {
    next(err);
  }
};

//get a game week team
export const getByGameWeekByTeamId: RequestHandler = async (req, res, next) => {
  try {
    // Team id
    const teamId = req.params.teamid;

    const gameWeekTeam = await GameWeekTeam.getByTeamId(teamId);
    if (!gameWeekTeam) {
      return next(new AppError("No game week team found.", 404));
    }

    //Respoonse
    res.status(200).json({
      status: "SUCCESS",
      data: { gameWeekTeam },
    });
  } catch (err) {
    next(err);
  }
};

// Get client game week team
export const getClientGameweekTeam: RequestHandler = async (req, res, next) => {
  try {
    const gameWeekTeam = await GameWeekTeam.getClientGameWeekTeam(
      req.params.game_week_id,
      req.params.client_id
    );
    if (!gameWeekTeam) {
      return res.status(404).json({
        status: "FAIL",
        data: [],
      });
    }

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        gameWeekTeam,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get game weeks a client has joined
export const getClientGameWeekTeams: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const client = <IClientDoc>req.user; // Data of the logged in client

    // Find all game weeks a clien has joined
    const clientGameWeeks = await GameWeekTeam.getClientGameWeekTeams(
      client.id
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      result: clientGameWeeks.length,
      data: { clientGameWeeks },
    });
  } catch (error) {
    next(error);
  }
};

// Get by game_week_id
export const getByGameWeekId: RequestHandler = async (req, res, next) => {
  try {
    const gameWeekTeams = await GameWeekTeam.getByGameWeekId(
      req.params.gameweekid,
      req.query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: gameWeekTeams.length,
      data: { gameWeekTeams },
    });
  } catch (error) {
    next(error);
  }
};

// Count clients in a specific game_week
export const countClientsInGameWeek: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const joinedClients = await GameWeekTeam.countClientsInGameWeek(
      req.params.gameweekid
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      joinedClients,
    });
  } catch (error) {
    next(error);
  }
};

//delete a single game week team
export const deleteGameWeekTeam: RequestHandler = async (req, res, next) => {
  try {
    const gameWeekTeamId = req.params.id;

    // Delete game week team and check if was existing
    const gameWeekTeam = await GameWeekTeamDAL.deleteGameWeekTeamById(
      gameWeekTeamId
    );
    if (!gameWeekTeam)
      return next(new AppError("Game week team does not exist", 404));

    //Respoonse
    res.status(200).json({
      status: "SUCCESS",
      messsage: "Game week team deleted successfuly!",
    });
  } catch (error) {
    next(error);
  }
};

//delete all game week teams
export const deleteAllGameWeekTeam: RequestHandler = async (req, res, next) => {
  try {
    const deleteKey = <IGameWeekTeamRequest.IDeleteAllGameWeekTeamInput>(
      req.value
    );

    if (configs.delete_key !== deleteKey.deleteKey) {
      return next(new AppError("No game week team found", 404));
    }

    // Permanently delete all game-week-teams in DB
    await GameWeekTeamDAL.deleteAllGameWeekTeams();

    //Respoonse
    res.status(200).json({
      status: "SUCCESS",
      messsage: "All Game week teams are deleted successfuly!",
    });
  } catch (error) {
    next(error);
  }
};

// Weekly leaderboard
export const getWeeklyLeaderBoard: RequestHandler = async (req, res, next) => {
  try {
    // Check if the game week exists
    const gameWeek = await GameWeek.getGameWeekById(req.params.gameWeekId);

    // Game week has started
    let has_started: boolean = false;

    if (gameWeek) {
      // Get the number of teams who joined the gameweek
      const count = await GameWeekTeam.countClientsInGameWeek(gameWeek._id);
      if (!gameWeek.is_done) {
        const gameWeekStartDate = gameWeek.first_match_start_date.getTime();
        if (gameWeekStartDate < Date.now()) {
          has_started = true;
          // Check the time interval
          if (gameWeek.time_interval.getTime() < Date.now()) {
            const job = live_rank({
              gameWeek,
              count,
              time_interval: new Date(Date.now() + 1 * 60 * 1000),
            });
            console.log(job);
            await GameWeek.updateTimeInterval({
              id: gameWeek._id,
              time_interval: Date.now() + 45 * 60 * 1000,
            });
          }
        }
      } else {
        has_started = true;
      }
    }

    // Users in leaderboard
    const weeklyLeaderBoard = await GameWeekTeam.getWeeklyLeaderboard(
      req.params.gameWeekId,
      req.query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: weeklyLeaderBoard.length,
      data: { weeklyLeaderBoard, has_started },
    });
  } catch (error) {
    next(error);
  }
};

// Get client weekly rank
export const getClientWeeklyRank: RequestHandler = async (req, res, next) => {
  try {
    const weeklyRank = await GameWeekTeam.getClientWeeklyRank(
      req.params.gameWeekId,
      req.params.client_id
    );

    // Data
    let data: IGameWeekTeamDoc[] | null = weeklyRank;
    if (data.length === 0) data = null;

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: weeklyRank.length,
      data: {
        weeklyRank: data,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Weekly leaderboard web
export const getWeeklyLeaderBoardWeb: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Users in leaderboard
    const weeklyLeaderBoard = await GameWeekTeam.getWeeklyLeaderboardWeb(
      req.params.gameWeekId
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: weeklyLeaderBoard.length,
      data: { weeklyLeaderBoard },
    });
  } catch (error) {
    next(error);
  }
};

// Yearly leaderboard
export const getYearlyLeaderboard: RequestHandler = async (req, res, next) => {
  try {
    // If no one has joined a game_week yet, send empty response
    // const gameWeekTeam = await GameWeekTeam.getAllGameWeekTeams(req.query);
    // if (Array.isArray(gameWeekTeam) && gameWeekTeam.length === 0) {
    //   return res.status(200).json({
    //     status: "SUCCESS",
    //     results: 0,
    //     data: { yearlyLeaderboard: [] },
    //   });
    // }

    // Find yearly leaderboard
    const yearlyLeaderboard = await TeamDAL.getYearlyLeaderboard(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: yearlyLeaderboard.length,
      data: { yearlyLeaderboard },
    });
  } catch (error) {
    next(error);
  }
};

// Get client yearly rank
export const getClientYearlyRank: RequestHandler = async (req, res, next) => {
  try {
    const yearlyRank = await TeamDAL.getClientYearlyRank(req.params.client_id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: yearlyRank.length,
      data: {
        yearlyRank,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Yearly leaderboard
export const getYearlyLeaderboardWeb: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // // If no one has joined a game_week yet, send empty response
    // const gameWeekTeam = await GameWeekTeam.getAllGameWeekTeams(req.query);
    // if (Array.isArray(gameWeekTeam) && gameWeekTeam.length === 0) {
    //   return res.status(200).json({
    //     status: "SUCCESS",
    //     results: 0,
    //     data: { yearlyLeaderboard: [] },
    //   });
    // }

    // Find yearly leaderboard
    const yearlyLeaderboard = await TeamDAL.getYearlyLeaderboardWeb();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: yearlyLeaderboard.length,
      data: { yearlyLeaderboard },
    });
  } catch (error) {
    next(error);
  }
};

// Get all game week teams - for admins
export const getClientGameWeeks: RequestHandler = async (req, res, next) => {
  try {
    const clientGameWeekTeams = await GameWeekTeam.getClientGameWeekTeams(
      req.params.clientId
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: clientGameWeekTeams.length,
      data: { clientGameWeekTeams },
    });
  } catch (error) {
    next(error);
  }
};

// Monthly leaderboard
export const getMonthlyLeaderBoard: RequestHandler = async (req, res, next) => {
  try {
    // Month
    const month = req.query.month as string;
    // // Convert given month to date
    // const monthOfLeaderboard = new Date(month).getMonth() + 1;

    // // Get currently month
    // const today = new Date();
    // const currentMonth = today.getMonth() + 1;

    // // Check requested month for a leaderboard is not same as the current month
    // if (
    //   currentMonth === monthOfLeaderboard ||
    //   monthOfLeaderboard > currentMonth
    // ) {
    //   return res.status(200).json({
    //     status: "SUCCESS",
    //     results: 0,
    //     data: { monthlyLeaderbaord: [] },
    //   });
    // }

    // Find monthly leaderboard
    const monthlyLeaderbaord = await GameWeekTeam.getMonthlyLeaderbaord(
      month,
      req.query
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: monthlyLeaderbaord.length,
      data: { monthlyLeaderbaord },
    });
  } catch (error) {
    next(error);
  }
};

// Get client monthly rank
export const getClientMonthlyRank: RequestHandler = async (req, res, next) => {
  try {
    // Month
    const month = req.query.month as string;
    // Convert given month to date
    const monthOfLeaderboard = new Date(month).getMonth() + 1;

    const monthlyRank = await GameWeekTeam.getClientMonthlyRank(
      month,
      req.params.client_id
    );

    // Data
    let data: IGameWeekTeamDoc[] | null = monthlyRank;
    if (data.length === 0) data = null;

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: monthlyRank.length,
      data: {
        monthlyRank: data,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get player selection stat
export const getPlayerSelectionStat: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const stat = await GameWeekTeam.playerSelectionStat();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        stat: {
          mostSelectedPlayer: stat.mostSelectedPlayer[0],
          mostCaptainedPlayer: stat.mostCaptainedPlayer[0],
          mostViceCaptainedPlayer: stat.mostViceCaptainedPlayer[0],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get player selection stat for a game week
export const getPlayerSelectionStatGameWeek: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const stat = await GameWeekTeam.playerSelectionGameWeekStat(
      req.params.game_week_id
    );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        stat: {
          mostSelectedPlayer: stat.mostSelectedPlayer[0],
          mostCaptainedPlayer: stat.mostCaptainedPlayer[0],
          mostViceCaptainedPlayer: stat.mostViceCaptainedPlayer[0],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Clients that have not joined a specific gameweek
export const getClientsNotJoinedGamweek: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Check game week exists
    const gameWeek = await GameWeek.getGameWeekById(req.params.gameweekId);
    if (!gameWeek) return next(new AppError("Game week does not exist", 404));

    // Find clients who have not joined the gameweek
    const clients = await GameWeekTeam.getClientsNotJoinedGamweek(
      req.params.gameweekId
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: clients.length,
      data: { clients },
    });
  } catch (error) {
    next(error);
  }
};

// Agents joined a game week
export const agentJoinedGameweek: RequestHandler = async (req, res, next) => {
  try {
    // Agents
    const agents = await GameWeekTeam.getAgentsJoinedGameweek();

    // Sum up the total number of agents joined a game week
    let total = 0;
    agents.forEach((agent) => {
      total += agent.total;
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: agents.length,
      data: {
        agents: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get phone numbers of users joined
export const getPhoneNumbersOfClients: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const data = await GameWeekTeam.getPhoneNumbersOfClients();

    // Phone numbers
    const phoneNumbers: string[] = [];
    data.forEach((el) => {
      phoneNumbers.push(el.client_id.phone_number);
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: phoneNumbers.length,
      data: {
        phoneNumbers,
      },
    });
  } catch (error) {
    next(error);
  }
};
