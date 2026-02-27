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
import GameWeekCompletionJobManager from "./utils/gameweek_completion_job";

/** Fetch all matches for a round. Entity Sport: page N typically has round N or N-1. */
async function fetchMatchesForRound(cid: string, round: string): Promise<any[]> {
  const all: any[] = [];
  const roundNum = Number(round) || 1;
  let page = Math.max(1, roundNum - 1);
  const base = configs.entity_sport?.url ?? "(no url)";
  console.log(`[gw_create] fetchMatchesForRound base=${base} cid=${cid} round=${round} startPage=${page}`);
  while (page <= 50) {
    const url = `${configs.entity_sport.url}/competition/${cid}/matches?token=${configs.entity_sport.token}&paged=${page}`;
    let res: any;
    try {
      res = await axios.get(url);
    } catch (e: any) {
      const status = e?.response?.status;
      const statusText = e?.response?.statusText;
      const data = e?.response?.data;
      console.log(`[gw_create] fetchMatchesForRound page=${page} axios error: status=${status} statusText=${statusText} data=${JSON.stringify(data ?? {}).slice(0, 200)}`);
      if (status === 404) {
        console.log(`[gw_create] fetchMatchesForRound 404 on page ${page}, stopping. total matches=${all.length}`);
        break;
      }
      throw e;
    }
    if (res.data.status !== "ok") {
      console.log(`[gw_create] fetchMatchesForRound page=${page} status!==ok: ${res.data.status}`);
      break;
    }
    const items = res.data.response?.items ?? [];
    if (items.length === 0) {
      console.log(`[gw_create] fetchMatchesForRound page=${page} empty items, stopping. total=${all.length}`);
      break;
    }
    const forRound = items.filter((m: any) => {
      const r = m.round;
      return r === round || r === roundNum || String(r) === String(round);
    });
    if (all.length === 0 && items.length > 0) {
      const sample = items.slice(0, 2).map((m: any) => ({ round: m.round }));
      console.log(`[gw_create] fetchMatchesForRound page=${page} sample rounds: ${JSON.stringify(sample)}`);
    }
    all.push(...forRound);
    console.log(`[gw_create] fetchMatchesForRound page=${page} items=${items.length} forRound=${forRound.length} total=${all.length}`);
    // Stop only when EVERY match on this page is from a higher round than our
    // target. Using minRound (not maxRound) avoids stopping early because of
    // a single out-of-order DGW match with a much higher round number.
    if (forRound.length === 0 && items.length > 0) {
      const minRound = Math.min(...items.map((m: any) => Number(m.round) || 0));
      if (minRound > roundNum) {
        console.log(`[gw_create] fetchMatchesForRound page=${page} minRound=${minRound} > ${roundNum}, all items past target, stopping.`);
        break;
      }
    }
    page++;
  }
  console.log(`[gw_create] fetchMatchesForRound done: round=${round} total=${all.length} pagesChecked=${page - 1}`);
  return all;
}

// Create game weeks
export const createGameWeek: RequestHandler = async (req, res, next) => {
  try {
    const { game_week, season_id, competition_id, is_free } = <
      GameWeekRequest.ICreateGameWeek
    >req.value;
    console.log(`[gw_create] createGameWeek START game_week=${game_week} season_id=${season_id} competition_id=${competition_id} is_free=${is_free}`);

    const checkGameWeek = await GameWeek.getGameWeek(game_week);
    if (checkGameWeek) {
      console.log(`[gw_create] createGameWeek FAIL game already exists: ${game_week}`);
      return next(new AppError("Game already exists", 400));
    }

    const season = await Season.getById(season_id);
    if (!season) {
      console.log(`[gw_create] createGameWeek FAIL unknown season: ${season_id}`);
      return next(
        new AppError(
          "Unknown season selected. Make sure there's a season with the specified season id",
          400
        )
      );
    }

    const competition = await Competition.getCompetition(competition_id);
    if (!competition) {
      console.log(`[gw_create] createGameWeek FAIL unknown competition: ${competition_id}`);
      return next(new AppError("Unknown competition selected", 400));
    }
    console.log(`[gw_create] createGameWeek fetching matches cid=${competition.cid} game_week=${game_week}`);

    const allMatches = await fetchMatchesForRound(competition.cid, String(game_week));
    console.log(`[gw_create] createGameWeek fetchMatchesForRound returned ${allMatches.length} matches`);
    if (allMatches.length === 0) {
      console.log(`[gw_create] createGameWeek FAIL no matches for round ${game_week}`);
      return next(new AppError(`No matches found for round ${game_week}`, 404));
    }

    // Match IDS (only from the specific round)
    const matchIds: string[] = [];
    allMatches.forEach((match: any) => {
      matchIds.push(match.mid);
    });

    // Last match (from the specific round)
    const lastMatch = allMatches[allMatches.length - 1];

    const activeGameweek = await GameWeek.getLiveGameWeek();
    console.log(`[gw_create] createGameWeek activeGameweek=${activeGameweek ? activeGameweek.game_week : "none"}`);

    if (activeGameweek) {
      console.log(`[gw_create] createGameWeek fetching previous round matches for GW ${activeGameweek.game_week}`);
      const previousRoundMatches = await fetchMatchesForRound(
        competition.cid,
        String(activeGameweek.game_week)
      );
      console.log(`[gw_create] createGameWeek previous round matches=${previousRoundMatches.length}`);
      if (previousRoundMatches.length > 0) {
        const previousLastMatch = previousRoundMatches[previousRoundMatches.length - 1];
        const lastEnd = new Date(previousLastMatch.dateend).getTime();
        const now = Date.now();
        if (lastEnd > now) {
          console.log(`[gw_create] createGameWeek FAIL current GW not done lastEnd=${lastEnd} now=${now}`);
          return next(
            new AppError(
              "The current game week is not done yet. Please create a new game week once the current game week ends",
              400
            )
          );
        }
      }
    }

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

    console.log(`[gw_create] createGameWeek SUCCESS game_week=${gameWeek.game_week} id=${gameWeek._id}`);
    res.status(201).json({
      status: "SUCCESS",
      date: new Date(Date.now()),
      message: "New game week created successfully",
      data: { gameWeek },
    });
  } catch (error: any) {
    console.log(`[gw_create] createGameWeek CATCH error=${error?.message} response=${error?.response ? { status: error.response.status, statusText: error.response.statusText, data: error.response.data } : "none"}`);
    if (error.response) {
      next(new AppError(error.response.data?.response ?? error.message, error.response.status));
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
      const previousRoundMatches = await fetchMatchesForRound(
        competition.cid,
        String(activeGameweek.game_week)
      );
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
      const previousRoundMatches = await fetchMatchesForRound(
        competition.cid,
        String(activeGameweek.game_week)
      );
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

    // Fetch the stat with timeout to prevent hanging
    // Use a longer timeout (60 seconds) as external API calls can be slow
    const result = await axios.all(urls.map((url) => axios.get(url, { timeout: 60000 })));

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

    // For DGW (multiple match IDs), the same player appears once per match.
    // Merge entries by pid so downstream point calculation works correctly.
    const mergedMap: { [pid: string]: Player } = {};
    const NUMERIC_STAT_FIELDS: Array<keyof Player> = [
      "minutesplayed", "goalscored", "assist", "passes", "shotsontarget",
      "cleansheet", "shotssaved", "penaltysaved", "tacklesuccessful",
      "yellowcard", "redcard", "owngoal", "goalsconceded", "penaltymissed",
      "chancecreated", "starting11", "substitute", "blockedshot",
      "interceptionwon", "clearance",
    ];
    for (const p of playerStat) {
      const pid = String(p.pid);
      if (!mergedMap[pid]) {
        mergedMap[pid] = { ...p };
      } else {
        for (const field of NUMERIC_STAT_FIELDS) {
          (mergedMap[pid] as any)[field] =
            ((mergedMap[pid] as any)[field] || 0) + ((p as any)[field] || 0);
        }
      }
    }
    const mergedPlayerStat = Object.values(mergedMap);

    // Add to Redis
    await GameWeek.addPlayerStat(gameWeek._id, mergedPlayerStat);

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

    // Check if player stats are available
    const playerStats = await GameWeek.getPlayerStat(gameWeek._id);
    if (!playerStats && is_done === true) {
      return next(new AppError("Cannot mark game week as done. Player stats not fetched yet.", 400));
    }

    // If marking as done, start the background job
    if (is_done === true) {
      // Start the completion job in the background
      await GameWeekCompletionJobManager.startCompletionJob(req.params.id);

      // Respond immediately
      res.status(202).json({
        status: "SUCCESS",
        message: "Game week completion job started. Points calculation is running in the background.",
        data: {
          gameWeekId: req.params.id,
          jobStatus: GameWeekCompletionJobManager.getJobStatus(req.params.id),
        },
      });
    } else {
      // If marking as not done (re-opening), do it synchronously
      const updatedGameweek = await GameWeek.updateToDone({
        id: req.params.id,
        is_done: false,
      });

      res.status(200).json({
        status: "SUCCESS",
        message: "Game week successfully reopened",
        data: {
          gameWeek: updatedGameweek,
        },
      });
    }
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

// Get match details for all match_ids stored in a game week
export const getGameWeekMatches: RequestHandler = async (req, res, next) => {
  try {
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek) return next(new AppError("Game week not found", 404));

    const matchIdSet = new Set<string>((gameWeek.match_ids ?? []).map(String));
    if (matchIdSet.size === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No match IDs stored for this game week",
        data: { matches: [], total: 0 },
      });
    }

    const roundNum = parseInt(gameWeek.game_week) || 1;
    const startPage = Math.max(1, roundNum - 2);
    const endPage = roundNum + 6;

    const matches: any[] = [];

    for (let page = startPage; page <= endPage; page++) {
      let resp: any;
      try {
        resp = await axios.get(
          `${configs.entity_sport.url}/competition/${gameWeek.cid}/matches?token=${configs.entity_sport.token}&paged=${page}`
        );
      } catch (e: any) {
        if (e?.response?.status === 404) break;
        throw e;
      }
      if (resp.data.status !== "ok") break;
      const items: any[] = resp.data.response?.items ?? [];
      if (items.length === 0) break;

      for (const m of items) {
        if (matchIdSet.has(String(m.mid))) {
          matches.push({
            mid: m.mid,
            round: m.round,
            status: m.status_str,
            date: m.datestart,
            home: { name: m.teams?.home?.tname, abbr: m.teams?.home?.abbr, logo: m.teams?.home?.logo },
            away: { name: m.teams?.away?.tname, abbr: m.teams?.away?.abbr, logo: m.teams?.away?.logo },
            result: m.result
              ? { home: m.result.home, away: m.result.away, winner: m.result.winner }
              : null,
            venue: m.venue?.name ?? null,
            is_rescheduled: String(m.round) !== String(gameWeek.game_week),
          });
        }
      }
      // Stop early once we have all match IDs
      if (matches.length === matchIdSet.size) break;
    }

    res.status(200).json({
      status: "SUCCESS",
      data: {
        game_week: gameWeek.game_week,
        matches,
        total: matches.length,
        total_stored_ids: matchIdSet.size,
        missing: matchIdSet.size - matches.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove a match ID from a game week's match list
export const removeMatch: RequestHandler = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek) return next(new AppError("Game week not found", 404));

    const exists = (gameWeek.match_ids ?? []).map(String).includes(String(matchId));
    if (!exists) return next(new AppError("Match ID not found in this game week", 404));

    await GameWeek.removeMatchId({ id: req.params.id, matchId: String(matchId) });

    res.status(200).json({
      status: "SUCCESS",
      message: `Match ${matchId} removed from GW${gameWeek.game_week}`,
      data: { matchId },
    });
  } catch (error) {
    next(error);
  }
};

// Browse a page of matches from Entity Sport for a game week's competition
// Used by admin to pick and manually add specific matches
export const browseMatches: RequestHandler = async (req, res, next) => {
  try {
    const gameWeek = await GameWeek.getGameWeekById(req.params.id);
    if (!gameWeek) return next(new AppError("Game week not found", 404));

    const page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const existingIds = new Set<string>((gameWeek.match_ids ?? []).map(String));

    let resp: any;
    try {
      resp = await axios.get(
        `${configs.entity_sport.url}/competition/${gameWeek.cid}/matches?token=${configs.entity_sport.token}&paged=${page}`
      );
    } catch (e: any) {
      if (e?.response?.status === 404) {
        return res.status(200).json({ status: "SUCCESS", data: { matches: [], page, has_more: false } });
      }
      throw e;
    }

    if (resp.data.status !== "ok") {
      return res.status(200).json({ status: "SUCCESS", data: { matches: [], page, has_more: false } });
    }

    const items: any[] = resp.data.response?.items ?? [];
    const matches = items.map((m: any) => ({
      mid: m.mid,
      round: m.round,
      status: m.status_str,
      date: m.datestart,
      home: { name: m.teams?.home?.tname, abbr: m.teams?.home?.abbr, logo: m.teams?.home?.logo },
      away: { name: m.teams?.away?.tname, abbr: m.teams?.away?.abbr, logo: m.teams?.away?.logo },
      result: m.result ? { home: m.result.home, away: m.result.away, winner: m.result.winner } : null,
      venue: m.venue?.name ?? null,
      already_added: existingIds.has(String(m.mid)),
    }));

    res.status(200).json({
      status: "SUCCESS",
      data: { matches, page, has_more: items.length > 0 },
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

// Get game week completion job status
export const getCompletionJobStatus: RequestHandler = async (req, res, next) => {
  try {
    const gameWeekId = req.params.id;
    const jobStatus = GameWeekCompletionJobManager.getJobStatus(gameWeekId);

    if (!jobStatus) {
      return res.status(404).json({
        status: "FAILED",
        message: "No completion job found for this game week",
        data: null,
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Job status retrieved successfully",
      data: { jobStatus },
    });
  } catch (error) {
    next(error);
  }
};

// Get all completion jobs
export const getAllCompletionJobs: RequestHandler = async (req, res, next) => {
  try {
    const jobs = GameWeekCompletionJobManager.getAllJobs();

    res.status(200).json({
      status: "SUCCESS",
      message: "All jobs retrieved successfully",
      data: { jobs },
    });
  } catch (error) {
    next(error);
  }
};

// Cleanup old completion jobs
export const cleanupCompletionJobs: RequestHandler = async (req, res, next) => {
  try {
    GameWeekCompletionJobManager.cleanupOldJobs();

    res.status(200).json({
      status: "SUCCESS",
      message: "Old jobs cleaned up successfully",
    });
  } catch (error) {
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
