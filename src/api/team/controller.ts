import AppError from "../../utils/app_error";
import Team from "./dal";
import { RequestHandler } from "express";
import slugifer from "../../utils/slugfier";
import IClientDoc from "../client/dto";
import checkTotalPlayersPrice from "./utils/total_players_price";
import checkNumOfPlayersAtEachPosition from "./utils/check_players_at_each_positions";
import threePlayersPerClub from "./utils/three_players_per_club";
import checkBenches from "./utils/check_benches";
import elevenPlayersRules from "./utils/eleven_players_rules";
import Client from "../client/dal";
import TeamDAL from "./dal";
import GameWeekDAL from "../game_week/dal";
import CoachDAL from "../coach/dal";
import checkNewPlayer from "./utils/check_new_player";
import updatedTeamBudget from "./utils/updated_team_budget";
import checkSwitchRules from "./utils/check_switch_rules";
import GameWeekTeam from "../game_week_team/dal";
import TransferHistory from "../transfer_history/dal";
import player_stats from "./utils/player_stats";
import calculate_fantasy_points from "./utils/calculate_fantasy_points";
import joinedActiveGW from "./utils/joined_active_gw";

// Create team
export const createTeam: RequestHandler = async (req, res, next) => {
  try {
    // Check client already has one team
    const loggedInUser = <IClientDoc>req.user;
    const clientTeams = await Team.getClientTeams(loggedInUser.id);
    if (clientTeams) {
      return next(new AppError("You can not create more than one team", 400));
    }

    // Incoming data
    const data = <ITeamRequest.ICreateTeamInput>req.value;
    data.team_name_slug = data.team_name.toLowerCase();
    data.team_name_slug = slugifer(data.team_name_slug);

    // Check coach exists in DB
    const favorite_coach = await CoachDAL.getCoachById(data.favorite_coach);
    if (!favorite_coach) return next(new AppError("Coach not found", 404));

    // Check total price of all players is within the user's budget
    const totalPlayersPrice = checkTotalPlayersPrice(data.players);
    data.budget = parseFloat((100 - totalPlayersPrice).toFixed(1)); // Update team budget

    // Check number of players at each position
    checkNumOfPlayersAtEachPosition(data.players);

    // Check max of 3 players are selected per club
    threePlayersPerClub(data.players);

    // Check there're only 4  benches. And one of the benches is a goal keeper
    checkBenches(data.players);

    // Check rules in the eleven players is satisfied
    elevenPlayersRules(data.players);

    // User
    const user = <IClientDoc>req.user;

    // Create team
    const team = await Team.createTeam(user.id, data);

    // Update client's has_team field and give 45 birr credit
    await Client.updateHasTeam(loggedInUser.id, true);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Team created successfully",
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

// Get all teams in DB - for admin side
export const getAllTeams: RequestHandler = async (req, res, next) => {
  try {
    const teams = await Team.getAllTeamsInDB(req.query);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: teams.length,
      data: { teams },
    });
  } catch (error) {
    next(error);
  }
};

export const getClientTeam: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user as IClientDoc;

    // Get the team of the logged-in client
    const team = await Team.getClientTeams(user.id);
    if (!team) {
      return next(new AppError("You have not created a team yet.", 400));
    }

    // Check if the client has joined the current active game week
    const activeGameWeek = await GameWeekDAL.getLiveGameWeek();
    const join_status = activeGameWeek
      ? await joinedActiveGW(user, activeGameWeek)
      : await joinedActiveGW(user);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { team, join_status },
    });
  } catch (error) {
    // Add more specific error handling here if needed
    next(error);
  }
};

// Get team by id - for admin side
export const getTeamByIdForAdmin: RequestHandler = async (req, res, next) => {
  try {
    const team = await Team.getTeamByIdForAdmin(req.params.teamId);
    if (!team) return next(new AppError("Team not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

// Get client team by name - for client
export const getByNameForClient: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user; // Data of the logged in client
    const teamName = req.params.teamname; // Team name from req.params

    // Find team
    const team = await Team.getTeamByNameForClient(
      req.params.id,
      teamName,
      user.id
    );
    if (!team) return next(new AppError("Team not found", 400));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

// Get a team by client ID
export const getTeamByClientID: RequestHandler = async (req, res, next) => {
  try {
    const team = await Team.getTeamByClientID(req.params.client_id);
    if (!team)
      return next(
        new AppError("There is no client with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        team,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Check team name is taken
export const teamNameAvailability: RequestHandler = async (req, res, next) => {
  try {
    // const teamName = req.params.teamname.toLowerCase();
    // const teamNameSlug = slugifer(teamName); // Team name from req.params

    // // Find team
    // const team = await Team.checkTeamNameIsAvailable(teamNameSlug);
    // let is_name_available: boolean = false;
    // if (!team) {
    //   is_name_available = true;
    // }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      is_name_available: true,
    });
  } catch (error) {
    next(error);
  }
};

// Delete team of a client - for clients
export const deleteClientTeam: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user; // Data of the logged in user

    const team = await Team.deleteClientTeam(req.params.id, user.id);
    if (!team) return next(new AppError("Team does not exist", 400));

    // Update client's has_team field
    await Client.updateHasTeam(user.id, false);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Team deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete team - for admin side
export const deleteTeam: RequestHandler = async (req, res, next) => {
  try {
    const team = await Team.deleteTeam(req.params.teamId);
    if (!team) return next(new AppError("Team does not exist", 404));

    // Update team owner's has_team field
    await Client.updateHasTeam(team.client_id, false);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Team delete successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all teams - for admin side
export const deleteAllTeams: RequestHandler = async (req, res, next) => {
  try {
    // Delete all teams in DB
    await Team.deleteAllTeams();

    // Set has_team of all clients to false
    await Client.setAllClientsHasTeamToFalse();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All teams in DB have been deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update team detail
export const updateTeamDetail: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <ITeamRequest.IUpdateTeamInput>req.value;
    const user = <IClientDoc>req.user; // Data of the logged in user

    // Team name is coming, slugify it.
    if (data.team_name) {
      data.team_name_slug = data.team_name.toLowerCase();
      data.team_name_slug = slugifer(data.team_name_slug);
    }

    // Update team
    const team = await Team.updateTeam(req.params.id, user.id, data);
    if (!team) return next(new AppError("Team does not exist", 400));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Team info updated successfully",
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

// Switch players
export const switchPlayers: RequestHandler = async (req, res, next) => {
  try {
    // Check the deadline for the current active game week
    const activeGameWeek = await GameWeekDAL.getLiveGameWeek();
    if (activeGameWeek) {
      const transferDeadline = activeGameWeek.transfer_deadline.getTime();
      if (transferDeadline < new Date(Date.now()).getTime()) {
        return next(
          new AppError(
            "The deadline to switch players for this week has passed",
            400
          )
        );
      }
    }

    // Incoming data
    const data = <ITeamRequest.ISwitchPlayersInput>req.value;
    const client = <IClientDoc>req.user; // Logged in user
    // Find client team
    const clientTeam = await Team.getClientTeams(client.id);
    if (!clientTeam) return next(new AppError("You don't have team yet", 400));

    // Extract the player that's going to be out
    const playerToBeOut = clientTeam.players.find((player) => {
      return player.pid === req.params.playerId;
    });

    // Extract the player that's going to be in
    const playerToBeIn = clientTeam.players.find((player) => {
      return player.pid === data.pid;
    });

    // Check if there is a double GW, and there is a player from the matches
    if (activeGameWeek) {
      if (activeGameWeek.is_double_gameweek) {
        // Double game week deadline
        const doubleGameweekTransferDeadline =
          activeGameWeek.double_gameweek_transfer_deadline.getTime();

        // Check if the players are in the double game week teams array
        if (playerToBeIn && playerToBeOut) {
          if (
            activeGameWeek.double_gameweek_teams.includes(playerToBeIn.club) ||
            activeGameWeek.double_gameweek_teams.includes(playerToBeOut.club)
          ) {
            if (
              doubleGameweekTransferDeadline < new Date(Date.now()).getTime()
            ) {
              return next(
                new AppError(
                  "You cannot switch players in a played match.",
                  400
                )
              );
            }
          }
        }
      }
    }

    // Check rules before switching
    if (playerToBeOut && playerToBeIn) {
      checkSwitchRules(playerToBeOut, playerToBeIn, clientTeam.players);
    } else {
      return next(new AppError("Either of players does not exist", 404));
    }

    // Update team players
    const team = await TeamDAL.updateTeamPlayers(
      clientTeam.id,
      clientTeam.players
    );
    if (!team) return next(new AppError("Team does not exist", 404));

    // If client has joined the current active game week, update his players
    if (activeGameWeek) {
      const clientGameWeekTeam = await GameWeekTeam.getByGameWeekAndClientId({
        client_id: client.id,
        game_week_id: activeGameWeek.id,
      });

      if (clientGameWeekTeam) {
        await GameWeekTeam.updateGameWeekPlayersOfClient(
          clientGameWeekTeam.id,
          team.players
        );
      }
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Players switched successfully",
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

// Transfer
export const transferPlayer: RequestHandler = async (req, res, next) => {
  try {
    // Check the deadline for the current active game week
    const activeGameWeek = await GameWeekDAL.getLiveGameWeek();
    if (activeGameWeek) {
      const transferDeadline = activeGameWeek.transfer_deadline.getTime();
      if (transferDeadline < new Date(Date.now()).getTime()) {
        return next(
          new AppError(
            "The deadline to transfer players for this week has passed",
            400
          )
        );
      }
    }

    // Incoming data
    const playerToBeIn = <ITeamRequest.ITransferPlayerInput>req.value;
    const client = <IClientDoc>req.user;

    // Find the client team
    const clientTeam = await Team.getClientTeams(client.id);
    if (!clientTeam)
      return next(new AppError("Game week team does not exist", 400));

    // Extract the player that's going to be out
    const playerToBeOut = clientTeam.players.find((player) => {
      return player.pid === req.params.playerId;
    });

    // Check player to be out exists in client's team
    if (!playerToBeOut) {
      return next(
        new AppError("Player to be out does not exist in your team", 404)
      );
    }

    // Check if there is a double GW, and there is a player from the matches
    if (activeGameWeek) {
      if (activeGameWeek.is_double_gameweek) {
        // Double game week deadline
        const doubleGameweekTransferDeadline =
          activeGameWeek.double_gameweek_transfer_deadline.getTime();

        // Check if the players are in the double game week teams array
        if (playerToBeIn && playerToBeOut) {
          if (
            activeGameWeek.double_gameweek_teams.includes(playerToBeIn.club) ||
            activeGameWeek.double_gameweek_teams.includes(playerToBeOut.club)
          ) {
            if (
              doubleGameweekTransferDeadline < new Date(Date.now()).getTime()
            ) {
              return next(
                new AppError(
                  "You cannot transfer players in a played match.",
                  400
                )
              );
            }
          }
        }
      }
    }

    // Check the new player is not from the client's players
    checkNewPlayer(clientTeam.players, playerToBeIn);

    // Check both players play in the same position
    if (playerToBeOut.position !== playerToBeIn.position) {
      return next(
        new AppError("Both players must have the same position", 400)
      );
    }

    // Calculate price difference
    const priceDifference = playerToBeOut.price - playerToBeIn.price;
    let updatedBudget: number | any = 0;
    updatedBudget = updatedTeamBudget(priceDifference, clientTeam.budget);

    // Store info of the player to be out in tempo variables
    const trxFullName = playerToBeOut.full_name;
    const trxPrice = playerToBeOut.price;
    const trxClub = playerToBeOut.club;

    // Check there're only 3 players per club
    playerToBeOut.club = playerToBeIn.club;
    threePlayersPerClub(clientTeam.players);

    // Do the transfer and update players field of the game-week-team
    playerToBeOut.pid = playerToBeIn.pid;
    playerToBeOut.price = playerToBeIn.price;
    playerToBeOut.club = playerToBeIn.club;
    playerToBeOut.club_logo = playerToBeIn.club_logo;
    playerToBeOut.full_name = playerToBeIn.full_name;

    // Update team budget
    const team = await TeamDAL.updateTeamBudgetAndPlayers(
      clientTeam.id,
      client.id,
      updatedBudget,
      clientTeam.players
    );
    if (!team) return next(new AppError("Team does not exist", 400));

    // Do the transfer
    await Team.switchPlayers(clientTeam.id, clientTeam.players);

    // If client has joined the current active game week, update his players
    if (activeGameWeek) {
      const clientGameWeekTeam = await GameWeekTeam.getByGameWeekAndClientId({
        client_id: client.id,
        game_week_id: activeGameWeek.id,
      });

      if (clientGameWeekTeam) {
        await GameWeekTeam.updateGameWeekPlayersOfClient(
          clientGameWeekTeam.id,
          team.players
        );
      }
    }

    // // Create transfer history
    await TransferHistory.createTransferHistory({
      client_id: client.id,
      team_id: clientTeam.id,
      bought_player: {
        full_name: playerToBeIn.full_name,
        club: playerToBeIn.club,
        price: playerToBeIn.price,
      },
      sold_player: {
        full_name: trxFullName,
        club: trxClub,
        price: trxPrice,
      },
    });

    // Response
    res.status(200).json({
      status: "SUCCESS",
      date: new Date(Date.now()),
      message: "Transfer done successfully",
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

// Change captain
export const changeCaptainViceCaptain: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Check deadline of the current game week
    const activeGameWeek = await GameWeekDAL.getLiveGameWeek();
    if (activeGameWeek) {
      const transferDeadline = activeGameWeek.transfer_deadline.getTime();
      if (transferDeadline < new Date(Date.now()).getTime()) {
        return next(new AppError("Deadline has passed", 400));
      }
    }

    const client = <IClientDoc>req.user; // Logged in user
    // Client team
    const clientTeam = await Team.getClientTeams(client.id);

    if (!clientTeam)
      return next(new AppError("You haven't created a team yet", 400));

    // Incoming data - player to be captain or vice captain
    const data = <ITeamRequest.IChangeCaptainViceCaptainInput>req.value;
    const playerToBeCaptain = clientTeam.players.find((player) => {
      return player.pid === data.pid;
    });
    if (!playerToBeCaptain) {
      return next(
        new AppError("Player to be captain or vice captain does not exist", 400)
      );
    }

    // Captain or vice captain  that's going to be changed
    const currentPlayer = clientTeam.players.find((player) => {
      if (
        player.pid === req.params.captainorvice &&
        (player.is_captain || player.is_vice_captain)
      ) {
        return player;
      }
    });
    if (!currentPlayer) {
      return next(
        new AppError(
          "You selected a player that's neither captain nor vice captain",
          400
        )
      );
    }

    // Check if there is a double GW, and there is a player from the matches
    if (activeGameWeek) {
      if (activeGameWeek.is_double_gameweek) {
        // Double game week deadline
        const doubleGameweekTransferDeadline =
          activeGameWeek.double_gameweek_transfer_deadline.getTime();

        // Check if the players are in the double game week teams array
        if (playerToBeCaptain && currentPlayer) {
          if (
            activeGameWeek.double_gameweek_teams.includes(
              playerToBeCaptain.club
            ) ||
            activeGameWeek.double_gameweek_teams.includes(currentPlayer.club)
          ) {
            if (
              doubleGameweekTransferDeadline < new Date(Date.now()).getTime()
            ) {
              return next(
                new AppError(
                  "You cannot make players captain or vice captain from a played match.",
                  400
                )
              );
            }
          }
        }
      }
    }

    // Change captain and vice captain based on d/t scenarios
    if (!playerToBeCaptain.is_bench && !currentPlayer.is_bench) {
      if (playerToBeCaptain.is_captain && currentPlayer.is_vice_captain) {
        playerToBeCaptain.is_captain = false;
        playerToBeCaptain.is_vice_captain = true;
        currentPlayer.is_captain = true;
        currentPlayer.is_vice_captain = false;
      } else if (
        playerToBeCaptain.is_vice_captain &&
        currentPlayer.is_captain
      ) {
        playerToBeCaptain.is_captain = true;
        playerToBeCaptain.is_vice_captain = false;
        currentPlayer.is_captain = false;
        currentPlayer.is_vice_captain = true;
      } else if (
        currentPlayer.is_captain &&
        !playerToBeCaptain.is_captain &&
        !playerToBeCaptain.is_vice_captain
      ) {
        currentPlayer.is_captain = false;
        playerToBeCaptain.is_captain = true;
      } else if (
        currentPlayer.is_vice_captain &&
        !playerToBeCaptain.is_captain &&
        !playerToBeCaptain.is_vice_captain
      ) {
        currentPlayer.is_vice_captain = false;
        playerToBeCaptain.is_vice_captain = true;
      } else {
        return next(new AppError("Invalid choice", 400));
      }
    } else {
      return next(new AppError("You can not select from benches", 400));
    }

    // Update players
    const team = await Team.updateTeamPlayers(
      clientTeam.id,
      clientTeam.players
    );
    if (!team) return next(new AppError("Team does not exist", 400));

    // If client has joined the current active game week, update his players
    if (activeGameWeek) {
      const clientGameWeekTeam = await GameWeekTeam.getByGameWeekAndClientId({
        client_id: client.id,
        game_week_id: activeGameWeek.id,
      });

      if (clientGameWeekTeam) {
        await GameWeekTeam.updateGameWeekPlayersOfClient(
          clientGameWeekTeam.id,
          team.players
        );
      }
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Captain/vice captain changed successfully",
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh points
export const refereshPoints: RequestHandler = async (req, res, next) => {
  try {
    // Get the active game week
    const activeGameWeek = await GameWeekDAL.getLiveGameWeek();
    if (!activeGameWeek) {
      return res.status(200).json({
        status: "SUCCESS",
        joinedActiveGameWeek: false,
      });
    }

    // Check the start date of the game week
    const gameWeekStartDate = activeGameWeek.first_match_start_date.getTime();
    if (gameWeekStartDate > Date.now()) {
      return res.status(200).json({
        status: "SUCCESS",
        joinedActiveGameWeek: false,
      });
    }

    // User
    const user = <IClientDoc>req.user;

    // Check if the client joined the game week
    const client = await GameWeekTeam.getByGameWeekAndClientId({
      game_week_id: activeGameWeek._id,
      client_id: user._id,
    });
    if (!client) {
      return res.status(200).json({
        status: "SUCCESS",
        joinedActiveGameWeek: false,
      });
    }

    // Get team
    const team = await TeamDAL.getTeamByIdForAdmin(client.team_id, true);

    // Use the match IDs to get the player stats
    const matchIds = activeGameWeek.match_ids;

    // Calculate the latest fantasy points for the client's players
    // const playerStats: Player[] = [];
    // for (let i = 0; i < matchIds.length; i++) {
    //   const playerStat = await player_stats(matchIds[i]);
    //   playerStats.push(...playerStat);
    // }
    const playerStats = await player_stats(matchIds);
    const players = calculate_fantasy_points(client.players, playerStats);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: players.length,
      joinedActiveGameWeek: true,
      data: {
        players,
        team,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update budget
export const updateBudget: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { amount } = <ITeamRequest.IUpdateBudgetInput>req.value;

    // Update
    const team = await TeamDAL.updateBudget({ id: req.params.id, amount });
    if (!team)
      return next(new AppError("There is no team with the specified ID", 404));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Budget successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Update budget of all teams
export const updateAllTeamsBudget: RequestHandler = async (req, res, next) => {
  try {
    // Number of teams in DB
    const teamCount = await Team.countAllTeams();
    if (teamCount > 0) {
      let page = Math.floor(teamCount / 10);
      if (teamCount % 10 !== 0) {
        page = page + 1;
      }

      for (let i = 1; i <= page; i++) {
        // Get all teams in DB
        const allTeams = await Team.getTeamsRecursivley(i);
        // Loop through all teams, find all players price and deduct it from 100
        for (let team of allTeams) {
          const teamPlayers = team.players;

          // Total price of all players in a team
          const totalPlayersPrice = teamPlayers.reduce(
            (accumulator, player) => accumulator + player.price,
            0
          );

          // Add total price of all players and remaining team budget
          const priceAndBudget = totalPlayersPrice + team.budget;

          if (priceAndBudget < 100) {
            // Difference b/n 100 and priceAndBudget
            const gap = parseFloat((100 - totalPlayersPrice).toFixed(1));

            // Update team budget
            await Team.updateBudget({ amount: gap, id: team._id });
          } else if (priceAndBudget > 100) {
            // If priceAndBudget > 100, deduct players price from 100 and set budget to the gap
            if (totalPlayersPrice <= 100) {
              // Difference b/n 100 and priceAndBudget
              const gap = parseFloat((100 - totalPlayersPrice).toFixed(1));
              await Team.updateBudget({
                amount: gap,
                id: team._id,
              });
            } else {
              await Team.updateBudget({ amount: 0, id: team._id });
            }
          }
        }
      }
    }

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Budget of all teams updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update favorite tactic
export const updateFavoriteTactic: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { favorite_tactic } = <ITeamRequest.IUpdateFavoriteTactic>req.value;

    // Update
    const team = await Team.updateTacticalStyle({
      id: req.params.id,
      favorite_tactic,
    });
    if (!team)
      return next(new AppError("There is no team with the specified ID", 404));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Favorite tactic successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Update favorite coach
export const updateFavoriteCoach: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { favorite_coach } = <ITeamRequest.IUpdateFavoriteCoach>req.value;

    // Check favorite coach
    const coach = await CoachDAL.getCoachById(favorite_coach);
    if (!coach)
      return next(new AppError("There is no coach with the specified ID", 404));

    // Update
    const team = await Team.updateFavoriteCoach({
      id: req.params.id,
      favorite_coach,
    });
    if (!team)
      return next(new AppError("There is no team with the specified ID", 404));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Favorite coach successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Update team profile
export const updateTeamProfile: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { favorite_coach, favorite_tactic } = <
      ITeamRequest.IUpdateTeamProfile
    >req.value;

    const coach = await CoachDAL.getCoachById(favorite_coach);
    if (!coach)
      return next(new AppError("There is no coach with the specified ID", 404));

    // Update
    const team = await Team.updateTeamProfile({
      id: req.params.id,
      favorite_coach,
      favorite_tactic,
    });
    if (!team)
      return next(new AppError("There is no team with the specified ID", 404));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Team profile successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Reset team
export const resetTeam: RequestHandler = async (req, res, next) => {
  try {
    // Logged in user
    const loggedInUser = <IClientDoc>req.user;

    // Find user team
    const userTeam = await Team.getClientTeams(loggedInUser.id);
    if (!userTeam) return next(new AppError("You don't have a team yet", 400));

    // Reset team
    const team = await Team.resetTeam(userTeam);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Your team has been reset successfully",
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

// Recreate team
export const recreateteam: RequestHandler = async (req, res, next) => {
  try {
    // Check client already has team and he/she reset their team
    const loggedInUser = <IClientDoc>req.user;

    // Client team
    const clientTeam = await Team.getClientTeams(loggedInUser.id);
    if (!clientTeam)
      return next(new AppError("You don't have a team yet", 400));

    if (clientTeam.budget !== 100 || clientTeam.players.length !== 0)
      return next(new AppError("You must first reset your team", 400));

    // Incoming data
    const data = <ITeamRequest.IRecreateTeam>req.value;

    // Check total price of all players is within the user's budget
    const totalPlayersPrice = checkTotalPlayersPrice(data.players);
    data.budget = parseFloat((100 - totalPlayersPrice).toFixed(1)); // Update team budget

    // Check number of players at each position
    checkNumOfPlayersAtEachPosition(data.players);

    // Check max of 3 players are selected per club
    threePlayersPerClub(data.players);

    // Check there're only 4  benches. And one of the benches is a goal keeper
    checkBenches(data.players);

    // Check rules in the eleven players is satisfied
    elevenPlayersRules(data.players);

    // Recreate client team
    const team = await Team.recreateTeam(clientTeam, data);

    // Resposne
    res.status(200).json({
      status: "SUCCESS",
      message: "You have successfully reset your team",
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};
