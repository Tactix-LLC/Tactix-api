import { fork } from "child_process";
import { join } from "path";

import GameWeek from "./dal";
import AppError from "../../utils/app_error";
import { RequestHandler } from "express";
import Season from "../season/dal";
import Competition from "../competition/dal";
import axios from "axios";
import configs from "../../configs";
import TimezoneUtil from "../../utils/timezone";
import GameWeekTeam from "../game_week_team/dal";
import GameWeekTeamModel from "../game_week_team/model";
import { Player } from "./dto";
import player_stats from "../team/utils/player_stats";
import { IPlayersData } from "../team/dto";
import TeamDAL from "../team/dal";
import calculate_fantasy_points from "../team/utils/calculate_fantasy_points";
import calculate_points from "./utils/calculate_points";
import live_rank from "../game_week_team/utils/live_rank";
import AutoJoinJobManager from "./utils/auto_join_job";
import NotificationJobManager from "./utils/notification_job";

// Create game weeks
export const createGameWeek: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const { game_week, season_id, competition_id, is_free } = <
      GameWeekRequest.ICreateGameWeek
    >req.value;

    // Check if there is a game week created using the name
    const checkGameWeek = await GameWeek.getGameWeek(game_week);
    if (checkGameWeek) return next(new AppError("Game already exists", 400));

    // Check season exists
    const season = await Season.getById(season_id);
    if (!season)
      return next(
        new AppError(
          "Unknown season selected. Make sure there's a season with the specified season id",
          400
        )
      );

    // Check competition exists
    const competition = await Competition.getCompetition(competition_id);
    if (!competition)
      return next(new AppError("Unknown competition selected", 400));

    // Get all matches for the specific round by fetching multiple pages
    let allMatches: any[] = [];
    let currentPage = parseInt(game_week);
    let hasMorePages = true;
    let maxPagesChecked = 0;
    
    while (hasMorePages && maxPagesChecked < 10) { // Safety limit to prevent infinite loops
      const competitionMatches = await axios.get(
        `${configs.entity_sport.url}/competition/${competition.cid}/matches?token=${configs.entity_sport.token}&paged=${currentPage}`
      );

      if (competitionMatches.data.status !== "ok") {
        break; // Stop if API returns error
      }

      const pageMatches = competitionMatches.data.response.items;
      const roundMatchesFromPage = pageMatches.filter((match: any) => match.round === game_week);
      
      // Add matches from this page
      allMatches.push(...roundMatchesFromPage);
      
      // Check if we should continue to next page
      // If this page has matches from our round, continue to next page
      // If this page has no matches from our round, we've found all matches
      hasMorePages = roundMatchesFromPage.length > 0;
      currentPage++;
      maxPagesChecked++;
    }
    
    if (allMatches.length === 0) {
      return next(new AppError(`No matches found for round ${game_week}`, 404));
    }

    // Match IDS (only from the specific round)
    const matchIds: string[] = [];
    allMatches.forEach((match: any) => {
      matchIds.push(match.mid);
    });

    // Last match (from the specific round)
    const lastMatch = allMatches[allMatches.length - 1];

    // Check if there is an active game week
    const activeGameweek = await GameWeek.getLiveGameWeek();

    // Check if there is an active game week and the last match of the game week ends
    if (activeGameweek) {
      // Previous matches
      const previousCompetitionMatches = await axios.get(
        `${configs.entity_sport.url}/competition/${competition.cid}/matches?token=${configs.entity_sport.token}&paged=${activeGameweek.game_week}`
      );

      const previousAllMatches = previousCompetitionMatches.data.response.items;
      const previousRoundMatches = previousAllMatches.filter((match: any) => match.round === activeGameweek.game_week);
      
      if (previousRoundMatches.length > 0) {
        const previousLastMatch = previousRoundMatches[previousRoundMatches.length - 1];

        if (new Date(previousLastMatch.dateend).getTime() > Date.now()) {
          return next(
            new AppError(
              "The current game week is not done yet. Please create a new game week once the current game week ends",
              400
            )
          );
        }
      }
    }

    // First match of the game week (from the specific round)
    const firstMatch = allMatches[0];

    // Check game week(from request body) is same as the round in the first index of 'response'
    // TODO Beka Check for last gameweek commented
    // if (game_week !== lastMatch.round) {
    //   return next(new AppError("Please select latest round", 400));
    // }

    // Calculate deadlines using proper timezone handling
    const deadlines = TimezoneUtil.calculateDeadlines(firstMatch.datestart);
    const ethiopianMatchEnd = TimezoneUtil.convertEntitySportDate(lastMatch.dateend);

    // Create game week
    const gameWeek = await GameWeek.createGameWeek({
      game_week,
      season_id,
      competition_id,
      sid: season.season_id,
      cid: competition.cid,
      purchase_deadline: deadlines.purchase_deadline,
      transfer_deadline: deadlines.transfer_deadline,
      first_match_start_date: deadlines.first_match_start_utc,
      last_match_end_date: ethiopianMatchEnd,
      match_ids: matchIds,
      is_free,
    });

    // Set "is_done" of the current game week to true
    if (gameWeek && activeGameweek) {
      await GameWeek.changeGameWeekToDone(activeGameweek._id);
    }

    // Schedule auto-join job for the new game week
    try {
      await AutoJoinJobManager.scheduleAutoJoinJob(gameWeek);
      console.log(`✅ Auto-join job scheduled for new game week: ${gameWeek.game_week}`);
    } catch (error) {
      console.error(`❌ Failed to schedule auto-join job for game week ${gameWeek.game_week}:`, error);
    }

    // Schedule transfer deadline reminder notification
    try {
      await NotificationJobManager.scheduleTransferDeadlineReminder(gameWeek);
      console.log(`✅ Transfer deadline reminder scheduled for new game week: ${gameWeek.game_week}`);
    } catch (error) {
      console.error(`❌ Failed to schedule transfer deadline reminder for game week ${gameWeek.game_week}:`, error);
    }

    // Response
    res.status(201).json({
      status: "SUCCESS",
      date: new Date(Date.now()),
      message: "New game week created successfully",
      data: { gameWeek },
    });
  } catch (error: any) {
    if (error.response) {
      next(new AppError(error.response.data.response, error.response.status));
    } else {
      next(error);
    }
  }
};

// Manual GW creation
export const createGameWeekManual: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const {
      competition_id,
      season_id,
      game_week,
      match_ids,
      is_free,
      first_match_start_date,
      last_match_end_date,
    } = <GameWeekRequest.ICreateGameWeekManual>req.value;

    // Check if there is a game week created using the name
    const checkGameWeek = await GameWeek.getGameWeek(game_week);
    if (checkGameWeek) return next(new AppError("Game already exists", 400));

    // Check season exists
    const season = await Season.getById(season_id);
    if (!season)
      return next(
        new AppError(
          "Unknown season selected. Make sure there's a season with the specified season id",
          400
        )
      );

    // Check competition exists
    const competition = await Competition.getCompetition(competition_id);
    if (!competition)
      return next(new AppError("Unknown competition selected", 400));

    // Check if there is an active game week
    const activeGameweek = await GameWeek.getLiveGameWeek();

    // Check if there is an active game week and the last match of the game week ends
    if (activeGameweek) {
      // Previous matches
      const previousCompetitionMatches = await axios.get(
        `${configs.entity_sport.url}/competition/${competition.cid}/matches?token=${configs.entity_sport.token}&paged=${activeGameweek.game_week}`
      );

      const previousLastMatch =
        previousCompetitionMatches.data.response.items[9];

      if (new Date(previousLastMatch.dateend).getTime() > Date.now()) {
        return next(
          new AppError(
            "The current game week is not done yet. Please create a new game week once the current game week ends",
            400
          )
        );
      }
    }

    // Calculate deadlines using proper timezone handling
    const deadlines = TimezoneUtil.calculateDeadlines(first_match_start_date);
    const ethiopianMatchEnd = TimezoneUtil.convertEntitySportDate(last_match_end_date.toString());

    // Create game week
    const gameWeek = await GameWeek.createGameWeek({
      game_week,
      season_id,
      competition_id,
      sid: season.season_id,
      cid: competition.cid,
      purchase_deadline: deadlines.purchase_deadline,
      transfer_deadline: deadlines.transfer_deadline,
      first_match_start_date: deadlines.first_match_start_utc,
      last_match_end_date: ethiopianMatchEnd,
      match_ids,
      is_free,
    });

    // Set "is_done" of the current game week to true
    if (gameWeek && activeGameweek) {
      await GameWeek.changeGameWeekToDone(activeGameweek._id);
    }

    // Schedule auto-join job for the new game week
    try {
      await AutoJoinJobManager.scheduleAutoJoinJob(gameWeek);
      console.log(`✅ Auto-join job scheduled for new game week: ${gameWeek.game_week}`);
    } catch (error) {
      console.error(`❌ Failed to schedule auto-join job for game week ${gameWeek.game_week}:`, error);
    }

    // Schedule transfer deadline reminder notification
    try {
      await NotificationJobManager.scheduleTransferDeadlineReminder(gameWeek);
      console.log(`✅ Transfer deadline reminder scheduled for new game week: ${gameWeek.game_week}`);
    } catch (error) {
      console.error(`❌ Failed to schedule transfer deadline reminder for game week ${gameWeek.game_week}:`, error);
    }

    // Response
    res.status(201).json({
      status: "SUCCESS",
      date: new Date(Date.now()),
      message: "New game week created successfully",
      data: { gameWeek },
    });
  } catch (error) {
    next(error);
  }
};

// Create game weeks
export const createDoubleGameWeek: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const {
      game_week,
      season_id,
      competition_id,
      first_match_start_date,
      last_match_end_date,
      is_double_gameweek,
      double_gameweek_first_match,
      double_gameweek_teams,
      is_free,
      match_ids,
    } = <GameWeekRequest.ICreateDoubleGameWeek>req.value;

    // Check if there is a game week created using the name
    const checkGameWeek = await GameWeek.getGameWeek(game_week);
    if (checkGameWeek) return next(new AppError("Game already exists", 400));

    // Check season exists
    const season = await Season.getById(season_id);
    if (!season)
      return next(
        new AppError(
          "Unknown season selected. Make sure there's a season with the specified season id",
          400
        )
      );

    // Check competition exists
    const competition = await Competition.getCompetition(competition_id);
    if (!competition)
      return next(new AppError("Unknown competition selected", 400));

    // Check if there is an active game week
    const activeGameweek = await GameWeek.getLiveGameWeek();

    // Check if there is an active game week and the last match of the game week ends
    if (activeGameweek) {
      // Previous matches
      const previousCompetitionMatches = await axios.get(
        `${configs.entity_sport.url}/competition/${competition.cid}/matches?token=${configs.entity_sport.token}&paged=${activeGameweek.game_week}`
      );

      const previousLastMatch =
        previousCompetitionMatches.data.response.items[9];

      if (new Date(previousLastMatch.dateend).getTime() > Date.now()) {
        return next(
          new AppError(
            "The current game week is not done yet. Please create a new game week once the current game week ends",
            400
          )
        );
      }
    }

    // Calculate deadlines using proper timezone handling
    const deadlines = TimezoneUtil.calculateDeadlines(first_match_start_date);
    const ethiopianMatchEnd = TimezoneUtil.convertEntitySportDate(last_match_end_date.toString());

    // Create game week
    const gameWeek = await GameWeek.createDoubleGameWeek({
      game_week,
      season_id,
      competition_id,
      sid: season.season_id,
      cid: competition.cid,
      purchase_deadline: deadlines.purchase_deadline,
      transfer_deadline: deadlines.transfer_deadline,
      first_match_start_date: deadlines.first_match_start_utc,
      last_match_end_date: ethiopianMatchEnd,
      match_ids,
      is_double_gameweek,
      double_gameweek_first_match: TimezoneUtil.convertEntitySportDate(double_gameweek_first_match.toString()),
      double_gameweek_transfer_deadline: deadlines.transfer_deadline,
      double_gameweek_teams,
      is_free,
    });

    // Set "is_done" of the current game week to true
    if (gameWeek && activeGameweek) {
      await GameWeek.changeGameWeekToDone(activeGameweek._id);
    }

    // Schedule auto-join job for the new game week
    try {
      await AutoJoinJobManager.scheduleAutoJoinJob(gameWeek);
      console.log(`✅ Auto-join job scheduled for new game week: ${gameWeek.game_week}`);
    } catch (error) {
      console.error(`❌ Failed to schedule auto-join job for game week ${gameWeek.game_week}:`, error);
    }

    // Schedule transfer deadline reminder notification
    try {
      await NotificationJobManager.scheduleTransferDeadlineReminder(gameWeek);
      console.log(`✅ Transfer deadline reminder scheduled for new game week: ${gameWeek.game_week}`);
    } catch (error) {
      console.error(`❌ Failed to schedule transfer deadline reminder for game week ${gameWeek.game_week}:`, error);
    }

    // Response
    res.status(201).json({
      status: "SUCCESS",
      date: new Date(Date.now()),
      message: "New game week created successfully",
      data: { gameWeek },
    });
  } catch (error: any) {
    if (error.response) {
      next(new AppError(error.response.data.response, error.response.status));
    } else {
      next(error);
    }
  }
};

// Get all game weeks
export const getAllGameWeeks: RequestHandler = async (req, res, next) => {
  try {
    const gameWeeks = await GameWeek.getAllGameWeeks(req.query);

    // Add participants_count to each game week
    const gameWeeksWithCount = await Promise.all(
      gameWeeks.map(async (gameWeek) => {
        const participants_count = await GameWeekTeam.countClientsInGameWeek(
          gameWeek._id
        );
        return {
          ...gameWeek.toObject(),
          participants_count,
        };
      })
    );

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: gameWeeksWithCount.length,
      data: { gameWeeks: gameWeeksWithCount },
    });
  } catch (error) {
    next(error);
  }
};

// Get game week by id
export const getGameWeekById: RequestHandler = async (req, res, next) => {
  try {
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek) return next(new AppError("Game week not found", 404));

    gameWeek.transfer_deadline = new Date(gameWeek.transfer_deadline.getTime());
    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { gameWeek },
    });
  } catch (error) {
    next(error);
  }
};

// Get active game week
export const getLiveGameWeek: RequestHandler = async (req, res, next) => {
  try {
    const gameWeek = await GameWeek.getLiveGameWeek();
    if (!gameWeek) {
      return res.status(200).json({
        status: "SUCCESS",
        data: null,
      });
    }

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        gameWeek,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update game week name
export const updateGameWeek: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const { game_week, season_id, competition_id } = <
      GameWeekRequest.IUpdateGameWeekName
    >req.value;

    // Check if the game exists with the specified id
    const getGameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!getGameWeek)
      return next(new AppError("Game week does not exists", 404));

    // Check if the game week is done
    if (getGameWeek.is_done)
      return next(new AppError("The game week is already done.", 400));

    // Check if there is a game week created using the name
    const checkGameWeek = await GameWeek.getGameWeek(game_week);
    if (checkGameWeek) return next(new AppError("Game already exists", 400));

    // Check season exists
    const season = await Season.getById(season_id);
    if (!season)
      return next(
        new AppError(
          "Unknown season selected. Make sure there's a season with the specified season id",
          400
        )
      );

    // Check competition is available in the selected season
    const seasonCompetitions = await axios.get(
      `${configs.entity_sport.url}/season/${season.name}/competitions?token=${configs.entity_sport.token}`
    );

    // Check season exists
    if (seasonCompetitions.data.status !== "ok") {
      return next(new AppError("Invalid season selected", 400));
    }

    // Competitions array
    const items = seasonCompetitions.data.response.items as Array<any>;

    // Check competition exists
    const competition = await Competition.getCompetition(competition_id);
    if (!competition)
      return next(new AppError("Unknown competition selected", 400));

    if (!items.some((comp) => comp.cid === competition.cid)) {
      return next(
        new AppError("Competition does not exist in the selected season", 400)
      );
    }

    // Get all matches in a competition to get the latest round.
    const competitionMatches = await axios.get(
      `${configs.entity_sport.url}/competition/${competition.cid}/matches?token=${configs.entity_sport.token}&paged=${game_week}`
    );

    if (competitionMatches.data.status !== "ok")
      return next(
        new AppError("Sorry, Competition match does not exist.", 404)
      );

    // Last match
    const lastMatch = competitionMatches.data.response.items[9];

    // First match of the game week0
    const firstMatch = competitionMatches.data.response.items[0];

    // Check game week(from request body) is same as the round in the first index of 'response'
    if (game_week !== firstMatch.round) {
      return next(new AppError("Please select latest round", 400));
    }

    // GMT
    const ethiopianMatchStart = new Date(firstMatch.datestart).getTime();
    const ethiopianMatchEnd = new Date(lastMatch.dateend).getTime();

    // Deadlines
    const transfer_deadline = ethiopianMatchStart - 2 * 60 * 60 * 1000;
    const purchase_deadline = ethiopianMatchStart - 5 * 60 * 1000;

    // Create game week
    const gameWeek = await GameWeek.updateGameWeekName({
      id: req.params.id,
      game_week,
      season_id,
      competition_id,
      sid: season.season_id,
      cid: competition.cid,
      purchase_deadline: new Date(purchase_deadline),
      transfer_deadline: new Date(transfer_deadline),
      first_match_start_date: new Date(ethiopianMatchStart),
      last_match_end_date: new Date(ethiopianMatchEnd),
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Game week is successfully updated",
      data: {
        gameWeek,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update to free
export const updateGameWeekToFree: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { is_free } = <GameWeekRequest.IUpdateIsFree>req.value;

    // Check if the game week is exists
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek) return next(new AppError("Game week does not exists", 404));

    // Check if the game week is active
    if (gameWeek.is_done)
      return next(new AppError("The game week is already done.", 400));

    // Update
    const updateGameWeek = await GameWeek.updateToIsFree({
      id: req.params.id,
      is_free,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Game week successfully updated",
      data: {
        gameWeek: updateGameWeek,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Player Stat
export const fetchPlayerStat: RequestHandler = async (req, res, next) => {
  try {
    // Get the game week
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek)
      return next(
        new AppError("There is no Gameweek with the specified ID", 404)
      );

    // Get the match IDS
    const matchIds = gameWeek.match_ids;

    // Generate URLs
    const urls: string[] = [];
    for (let i = 0; i < matchIds.length; i++) {
      urls.push(
        `${configs.entity_sport.url}/matches/${matchIds[i]}/newfantasy?token=${configs.entity_sport.token}`
      );
    }

    // Fetch the stat
    const result = await axios.all(urls.map((url) => axios.get(url)));

    // Stat
    const playerStat: Player[] = [];
    result.forEach((stat) => {
      // Check if there is a player stat
      if (!Array.isArray(stat.data.response.items.playerstats)) {
        playerStat.push(...stat.data.response.items.playerstats.home);
        playerStat.push(...stat.data.response.items.playerstats.away);

        // Home team
        const homeTeam: { tname: string } =
          stat.data.response.items.match_info.teams.home;
        // Away team
        const awayTeam: { tname: string } =
          stat.data.response.items.match_info.teams.away;

        // Home team players
        const homeTeamPlayers: [
          { pid: string; pname: string; role: string; tname: string }
        ] = stat.data.response.items.teams.home;
        homeTeamPlayers.forEach((player) => {
          player.tname = homeTeam.tname;
        });

        // Away team players
        const awayTeamPlayers: [
          { pid: string; pname: string; role: string; tname: string }
        ] = stat.data.response.items.teams.away;
        awayTeamPlayers.forEach((player) => {
          player.tname = awayTeam.tname;
        });

        // Player roles
        const playersRoles: { pid: string; role: string; tname: string }[] = [];
        playersRoles.push(...homeTeamPlayers);
        playersRoles.push(...awayTeamPlayers);

        // Players roles object
        const playersRoleObj: {
          [key: string]: { role: string; tname: string };
        } = {};
        playersRoles.forEach((player) => {
          playersRoleObj[player.pid] = {
            role: player.role,
            tname: player.tname,
          };
        });

        // Add roles
        playerStat.forEach((player) => {
          if (playersRoleObj[player.pid]) {
            player.role = playersRoleObj[player.pid].role;
            player.tname = playersRoleObj[player.pid].tname;
          }
        });
      }
    });

    // Add to Redis
    await GameWeek.addPlayerStat(gameWeek._id, playerStat);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Player stats successfully fetched",
    });
  } catch (error) {
    next(error);
  }
};

// Get player stat
export const getPlayerStat: RequestHandler = async (req, res, next) => {
  try {
    // Get the game week
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek)
      return next(
        new AppError("There is no Gameweek with the specified ID", 404)
      );

    // Get player stat
    const stat = await GameWeek.getPlayerStat(gameWeek._id);
    if (!stat) return next(new AppError("Can not get the data", 404));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        stat: JSON.parse(stat),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update game week to done
export const updateToDone: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { is_done } = <GameWeekRequest.IUpdateToDone>req.value;

    // Check if there is live game week
    if (is_done === false) {
      // Check if there is a live game week
      const liveGameWeek = await GameWeek.getLiveGameWeek();
      if (liveGameWeek)
        return next(
          new AppError("There is a live game week already in the system", 400)
        );
    }

    // Check if the game week exists
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek) return next(new AppError("Game week does not exists", 404));

    // Check Date
    // if (new Date(gameWeek.last_match_end_date).getTime() > Date.now()) {
    //   return next(
    //     new AppError(
    //       "The current game week is not done yet. Please create a new game week once the current game week ends",
    //       400
    //     )
    //   );
    // }

    // Get the number of teams who joined the gameweek
    const count = await GameWeekTeam.countClientsInGameWeek(gameWeek._id);

    // Check if there are team created under this game week
    if (count > 0) {
      // Page
      let page = Math.floor(count / 10);
      if (count % 10 !== 0) {
        page += 1;
      }

      // Player stats
      const playerStats = await GameWeek.getPlayerStat(gameWeek._id);
      if (!playerStats)
        return next(new AppError("Can not fetch the player stat data", 404));

      // Loop on the whole teams that joined this specific game week and update the points
      for (let i = 1; i <= page; i++) {
        const gameWeekTeams = await GameWeekTeam.getGameweekTeamsForPoint(
          gameWeek._id,
          i
        );
        gameWeekTeams.forEach(async (gameWeekTeam) => {
          // Calculate player points
          const playersPoints = await calculate_fantasy_points(
            gameWeekTeam.players,
            JSON.parse(playerStats)
          );

          const { totalPoint, players } = await calculate_points(playersPoints);

          // Update the team with the latest points
          const updatedGameWeekTeam =
            await GameWeekTeam.updateTotalGameWeekPointAndPlayers({
              id: gameWeekTeam._id,
              total_point: totalPoint,
              players: players,
            });

          // Calculate cumulative total fantasy points across all completed game weeks
          const cumulativeTotal = await calculateCumulativeTeamPoints(gameWeekTeam.team_id);

          // Update players on team with cumulative total
          const updatedTeam = await TeamDAL.updateFantasyPointAndPlayers({
            id: gameWeekTeam.team_id,
            total_fantasy_point: cumulativeTotal,
          });
        });
      }
    }

    // Update
    const updatedGameweek = await GameWeek.updateToDone({
      id: req.params.id,
      is_done,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Game week successfully updated",
      data: {
        gameWeek: updatedGameweek,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete all game weeks
export const deleteAllGameWeeks: RequestHandler = async (req, res, next) => {
  try {
    // Check delete key
    if (req.body.delete_key !== configs.delete_key) {
      return next(new AppError("Invalid delete key", 400));
    }

    await GameWeek.deleteAllGameWeeks(); // Delete all game_weeks
    await GameWeekTeam.deleteAllGameWeekTeams(); // Delete all game_week_teams

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All game weeks deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete one game week by id
export const deleteGameWeekById: RequestHandler = async (req, res, next) => {
  try {
    const gameWeek = await GameWeek.deleteGameWeek(req.params.id);
    if (!gameWeek) return next(new AppError("Game week does not exist", 400));

    // Delete all game_week_teams under the deleted game_week
    await GameWeekTeam.deleteByGameWeekId(gameWeek.id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Game week deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update game weeek status
export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <GameWeekRequest.IUpdateStatus>req.value;

    // Check if the game week exists
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek) return next(new AppError("Game week does not exists", 404));

    // Check if the game week is live only if the input is false
    if (data.is_active === false) {
      if (!gameWeek.is_done)
        return next(
          new AppError(
            "The game week is still live. You can not update its status",
            400
          )
        );
    }

    const updatedGameWeek = await GameWeek.updateStatus(req.params.id, data);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Game week status updated successfully",
      data: {
        gameWeek: updatedGameWeek,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Game week interval time
export const updateGameWeekIntervalTime: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Get game week
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek)
      return next(
        new AppError("There is no game week with the specified ID", 404)
      );

    // Update time interval
    const updatedGameWeek = await GameWeek.updateTimeInterval({
      id: req.params.id,
      time_interval: gameWeek.first_match_start_date.getTime() + 2 * 60 * 1000,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Time interval successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

// Add Match ID
export const addMatchId: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { match_id } = <GameWeekRequest.IAddMatchId>req.value;

    // Add
    const gameWeek = await GameWeek.addMatchId({
      id: req.params.id,
      matchId: match_id,
    });
    if (!gameWeek)
      return next(
        new AppError("There is no game week with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Match ID added successfully",
      data: {
        gameWeek,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update transfer and purchase deadlines
export const updateDeadlines: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <GameWeekRequest.IUpdateDeadline>req.value;
    data.transfer_deadline = new Date(data.transfer_deadline);
    data.purchase_deadline = new Date(data.purchase_deadline);
    data.first_match_start_date = new Date(data.first_match_start_date);
    data.last_match_end_date = new Date(data.last_match_end_date);
    if (data.time_interval) {
      data.time_interval = new Date(data.time_interval);
    }

    // Update
    const gameweek = await GameWeek.updateDeadline(req.params.id, data);
    if (!gameweek) return next(new AppError("Gameweek not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Deadlines for transfer and purchase updated successfully",
      data: { gameweek },
    });
  } catch (error) {
    next(error);
  }
};

// Manual trigger auto-join for a specific game week
export const triggerAutoJoin: RequestHandler = async (req, res, next) => {
  try {
    console.log('🚀 [triggerAutoJoin] Manual trigger for game week:', req.params.id);
    
    const gameWeekId = req.params.id;
    const adminId = req.body.admin?._id || req.body.admin?.id; // Get admin ID from authenticated request
    
    // Execute auto-join with manual trigger type and admin ID
    const results = await AutoJoinJobManager.executeAutoJoin(gameWeekId, "manual", adminId);
    
    console.log('✅ [triggerAutoJoin] Results:', results);
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Auto-join executed successfully",
      data: {
        gameWeekId,
        results: {
          success: results.success,
          failed: results.failed,
          totalProcessed: results.success + results.failed,
          errors: results.errors
        }
      },
    });
  } catch (error) {
    console.error('❌ [triggerAutoJoin] Error:', error);
    next(error);
  }
};

// Get auto-join job status
export const getAutoJoinStatus: RequestHandler = async (req, res, next) => {
  try {
    const scheduledJobs = AutoJoinJobManager.getScheduledJobs();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Auto-join status retrieved successfully",
      data: {
        scheduledJobs: scheduledJobs.map(job => ({
          gameWeekId: job.gameWeekId,
          nextInvocation: job.nextInvocation?.toISOString() || null
        }))
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reschedule all auto-join jobs
export const rescheduleAutoJoinJobs: RequestHandler = async (req, res, next) => {
  try {
    console.log('🔄 [rescheduleAutoJoinJobs] Rescheduling all auto-join jobs');
    
    await AutoJoinJobManager.rescheduleAllJobs();
    
    const scheduledJobs = AutoJoinJobManager.getScheduledJobs();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Auto-join jobs rescheduled successfully",
      data: {
        rescheduledJobs: scheduledJobs.length,
        scheduledJobs: scheduledJobs.map(job => ({
          gameWeekId: job.gameWeekId,
          nextInvocation: job.nextInvocation?.toISOString() || null
        }))
      },
    });
  } catch (error) {
    console.error('❌ [rescheduleAutoJoinJobs] Error:', error);
    next(error);
  }
};

// Helper function to calculate cumulative team points across all completed game weeks
async function calculateCumulativeTeamPoints(teamId: string): Promise<number> {
  try {
    // Get all game week teams for this team across all game weeks
    const allGameWeekTeams = await GameWeekTeam.getByTeamId(teamId);
    
    let cumulativeTotal = 0;
    
    for (const gameWeekTeam of allGameWeekTeams) {
      // Only include points from completed game weeks
      const gameWeek = await GameWeek.getGameWeekById(gameWeekTeam.game_week_id);
      if (gameWeek && gameWeek.is_done) {
        cumulativeTotal += gameWeekTeam.total_fantasy_point || 0;
      }
    }
    
    return cumulativeTotal;
  } catch (error) {
    console.error('Error calculating cumulative team points:', error);
    return 0;
  }
}
