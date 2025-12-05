import PlayerStat from "./dal";
import AppError from "../../utils/app_error";
import { RequestHandler } from "express";
import GameWeek from "../game_week/dal";
import calculate_points from "./utils/calculate_points";
import { IPlayerStat } from "./dto";
import FantasyRoaster from "../fantasy_roaster/dal";
import { IFantasyRoasterPlayer } from "../fantasy_roaster/dto";
import GameWeekTeam from "../game_week_team/dal";
import TeamDAL from "../team/dal";
import calculate_fantasy_points from "../team/utils/calculate_fantasy_points";
import calculate_team_points from "../game_week/utils/calculate_points";

// Direct fantasy points calculation (same logic as frontend)
function calculateFantasyPoints(player: any): number {
  let points = 0;
  
  // Playing time points
  if (player.minutesplayed >= 60) points += 2;
  else if (player.minutesplayed > 0) points += 1;
  
  // Goals (position-based)
  const goals = player.goalscored || 0;
  if (player.position === 'Goalkeeper') points += goals * 10;
  else if (player.position === 'Defender') points += goals * 6;
  else if (player.position === 'Midfielder') points += goals * 5;
  else if (player.position === 'Forward') points += goals * 4;
  
  // Assists
  points += (player.assist || 0) * 3;
  
  // Clean sheets
  if (player.position === 'Goalkeeper' || player.position === 'Defender') {
    points += (player.cleansheet || 0) * 4;
  } else if (player.position === 'Midfielder') {
    points += (player.cleansheet || 0) * 1;
  }
  
  // Goalkeeper saves (per 3)
  points += Math.floor((player.shotssaved || 0) / 3);
  
  // Penalty saves
  points += (player.penaltysaved || 0) * 5;
  
  // Negative points
  points -= (player.yellowcard || 0) * 1;
  points -= (player.redcard || 0) * 3;
  points -= (player.owngoal || 0) * 2;
  points -= (player.penaltymissed || 0) * 2;
  
  // Goals conceded (GK/DEF only, per 2 goals)
  if (player.position === 'Goalkeeper' || player.position === 'Defender') {
    points -= Math.floor((player.goalsconceded || 0) / 2);
  }
  
  return points;
}

// Create player stat for a gameweek
export const createPlayerStat: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { gameweekid } = <PlayerStatRequest.ICreatePlayerStat>req.value;

    // Get a game week
    const gameWeek = await GameWeek.getGameWeekById(gameweekid);
    if (!gameWeek)
      return next(
        new AppError("There is no game week with the specified ID", 404)
      );

    // Get player stats
    const stat = await GameWeek.getPlayerStat(gameWeek._id);
    if (!stat) return next(new AppError("Can not fetch playes' stat", 404));

    // Active roaster
    const activeRoaster = await FantasyRoaster.getFantasyRoaster();
    if (activeRoaster.length === 0)
      return next(new AppError("There is no active roaster", 404));

    // Players from Roaster
    const roasterPlayers = activeRoaster[0].players;

    // Roaster Obj
    let roasterObj: Partial<{ [key: string]: IFantasyRoasterPlayer }> = {};
    roasterPlayers.forEach((player) => {
      roasterObj[player.pid] = player;
    });

    // Update stat

    // Fetched stat
    const fetchedStat = JSON.parse(stat);
    fetchedStat.forEach((stat: any) => {
      if (roasterObj[stat.pid]) {
        stat.role = roasterObj[stat.pid]?.role;
      }
    });

    // Calculate fantasy points based on the stat
    const playerStat = await calculate_points(fetchedStat);

    // Check if the players has team name and role
    const validPlayerStat: IPlayerStat[] = [];
    playerStat.forEach((player: IPlayerStat) => {
      if (player.tname && player.position) {
        validPlayerStat.push(player);
      }
    });

    // Create
    const newPlayerStat = await PlayerStat.createPlayerStat({
      game_week_id: gameWeek._id,
      players: validPlayerStat,
    });

    // Respond
    res.status(201).json({
      status: "SUCCESS",
      message: "Player stat successfully created",
      data: {
        playerStat: newPlayerStat,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all player stats for admin
export const getAllPlayerStats: RequestHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const gameWeekId = req.query.gameWeekId as string;

    let query: any = {};
    if (gameWeekId) {
      query.game_week_id = gameWeekId;
    }

    const playerStats = await PlayerStat.getAllPlayerStats(query, page, limit);
    const total = await PlayerStat.countPlayerStats(query);

    res.status(200).json({
      status: "SUCCESS",
      message: "Player stats retrieved successfully",
      data: {
        playerStat: playerStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get aggregated player stats across all game weeks (for mobile app)
export const getAggregatedPlayerStats: RequestHandler = async (req, res, next) => {
  try {
    // Get all completed game weeks
    const completedGameWeeks = await GameWeek.getCompletedGameWeeks();
    
    if (!completedGameWeeks || completedGameWeeks.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No completed game weeks found",
        data: {
          playerStat: []
        }
      });
    }

    // Get all player stats for completed game weeks
    const aggregatedStats = await PlayerStat.getAggregatedPlayerStats();
    
    res.status(200).json({
      status: "SUCCESS",
      message: "Aggregated player stats retrieved successfully",
      data: {
        playerStat: aggregatedStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get player stats for a specific game week
export const getPlayerStatsByGameWeek: RequestHandler = async (req, res, next) => {
  try {
    // Handle both parameter names: gameweekid (from old route) and gameWeekId (from admin route)
    const gameWeekId = req.params.gameweekid || req.params.gameWeekId;
    const page = parseInt(req.query.page as string) || 1;
    // Use high default limit (10000) for mobile app when no limit specified, 100 for admin pagination
    const limitParam = req.query.limit as string;
    const limit = limitParam ? parseInt(limitParam) : 10000;
    const search = req.query.search as string;

    // Get the game week to validate it exists
    const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
    if (!gameWeek) {
      return next(new AppError("Game week not found", 404));
    }

    const playerStats = await PlayerStat.getPlayerStatsByGameWeek(gameWeekId, search, page, limit);

    res.status(200).json({
      status: "SUCCESS",
      message: "Player stats retrieved successfully",
      data: {
        gameWeek: {
          _id: gameWeek._id,
          game_week: gameWeek.game_week,
          is_done: gameWeek.is_done
        },
        playerStat: playerStats?.players || [],
        total: (playerStats as any)?.totalCount || playerStats?.players?.length || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update individual player stats
export const updatePlayerStat: RequestHandler = async (req, res, next) => {
  try {
    const { gameWeekId, playerId } = req.params;
    const updateData = req.body;

    // Validate game week exists
    const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
    if (!gameWeek) {
      return next(new AppError("Game week not found", 404));
    }

    // Get current player stats (load all players, not just first 100)
    const playerStatDoc = await PlayerStat.getPlayerStatsByGameWeek(gameWeekId, undefined, 1, 10000);
    if (!playerStatDoc) {
      return next(new AppError("Player stats not found for this game week", 404));
    }

    // Find the player to update (convert to string for comparison)
    const playerIndex = playerStatDoc.players.findIndex(p => 
      p.pid && p.pid.toString() === playerId
    );
    if (playerIndex === -1) {
      return next(new AppError("Player not found in game week stats", 404));
    }

    // Update the player's stats
    const originalPlayer = playerStatDoc.players[playerIndex];
    
    // Use toObject() to convert Mongoose document to plain object, then deep clone
    const updatedPlayer = JSON.parse(JSON.stringify((originalPlayer as any).toObject ? (originalPlayer as any).toObject() : originalPlayer));
    
    // Update only the stat fields that are provided (raw stats)
    const allowedStatFields = [
      'minutesplayed', 'goalscored', 'assist', 'cleansheet', 'shotssaved', 
      'penaltysaved', 'yellowcard', 'redcard', 'owngoal', 'goalsconceded', 
      'penaltymissed', 'passes', 'shotsontarget', 'tacklesuccessful', 
      'chancecreated', 'starting', 'substitute', 'blockedshot', 
      'interceptionwon', 'clearance'
    ];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && allowedStatFields.includes(key)) {
        // Update both the main field and the stat object
        (updatedPlayer as any)[key] = updateData[key];
        if (updatedPlayer.stat) {
          (updatedPlayer.stat as any)[key] = updateData[key];
        }
      }
    });

    // Recalculate fantasy points using direct calculation (calculate_points is broken for individual updates)
    try {
      const oldPoints = updatedPlayer.fantasy_point;
      updatedPlayer.fantasy_point = calculateFantasyPoints(updatedPlayer);
      console.log('Fantasy points updated:', oldPoints, '->', updatedPlayer.fantasy_point);
    } catch (error) {
      console.error('Error calculating points:', error);
      // Keep the original player data if calculation fails
    }

    // Update the player in the array
    playerStatDoc.players[playerIndex] = updatedPlayer;

    // Save the updated document
    const updatedPlayerStat = await PlayerStat.updatePlayerStat(playerStatDoc._id, {
      players: playerStatDoc.players
    });

    // Team points will be recalculated manually using the "Recalculate Team Points" button

    res.status(200).json({
      status: "SUCCESS",
      message: "Player stats updated successfully",
      data: {
        player: updatedPlayer,
        recalculatedFantasyPoints: updatedPlayer.fantasy_point
      }
    });
  } catch (error) {
    next(error);
  }
};

// Bulk update player stats
export const bulkUpdatePlayerStats: RequestHandler = async (req, res, next) => {
  try {
    const { gameWeekId } = req.params;
    const { updates } = req.body; // Array of { pid, ...updateData }

    // Validate game week exists
    const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
    if (!gameWeek) {
      return next(new AppError("Game week not found", 404));
    }

    // Get current player stats
    const playerStatDoc = await PlayerStat.getPlayerStatsByGameWeek(gameWeekId);
    if (!playerStatDoc) {
      return next(new AppError("Player stats not found for this game week", 404));
    }

    const updatedPlayers: IPlayerStat[] = [];

    // Process each update
    for (const update of updates) {
      const playerIndex = playerStatDoc.players.findIndex(p => p.pid === update.pid);
      if (playerIndex !== -1) {
        const updatedPlayer = { ...playerStatDoc.players[playerIndex] };
        
        // Update only the fields that are provided
        Object.keys(update).forEach(key => {
          if (update[key] !== undefined && key !== 'fantasy_point' && key !== 'pid') {
            (updatedPlayer as any)[key] = update[key];
          }
        });

        // Recalculate fantasy points
        const recalculatedStats = await calculate_points([updatedPlayer as any]);
        updatedPlayer.fantasy_point = recalculatedStats[0].fantasy_point;

        playerStatDoc.players[playerIndex] = updatedPlayer;
        updatedPlayers.push(updatedPlayer);
      }
    }

    // Save the updated document
    await PlayerStat.updatePlayerStat(playerStatDoc._id, {
      players: playerStatDoc.players
    });

    // If game week is done, recalculate all affected team points
    if (gameWeek.is_done) {
      for (const player of updatedPlayers) {
        await recalculateTeamPoints(gameWeekId, player.pid, player);
      }
    }

    res.status(200).json({
      status: "SUCCESS",
      message: `${updatedPlayers.length} player stats updated successfully`,
      data: {
        updatedPlayers,
        updatedCount: updatedPlayers.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to recalculate team points when player stats change
async function recalculateTeamPoints(gameWeekId: string, playerId: string, updatedPlayerStat: IPlayerStat) {
  try {
    // Find all teams in this game week that have this player
    const teamsWithPlayer = await GameWeekTeam.getTeamsWithPlayer(gameWeekId, playerId);
    
    for (const team of teamsWithPlayer) {
      // Update the player's stats in the team
      const playerIndex = team.players.findIndex((p: any) => p.pid === playerId);
      if (playerIndex !== -1) {
        // Update only the stat fields, preserve all required team player fields
        const existingPlayer = team.players[playerIndex];
        team.players[playerIndex] = {
          ...existingPlayer,
          // Update only the stat-related fields
          fantasy_point: updatedPlayerStat.fantasy_point,
          minutesplayed: updatedPlayerStat.minutesplayed,
          goalscored: updatedPlayerStat.goalscored,
          assist: updatedPlayerStat.assist,
          cleansheet: updatedPlayerStat.cleansheet,
          shotssaved: updatedPlayerStat.shotssaved,
          penaltysaved: updatedPlayerStat.penaltysaved,
          yellowcard: updatedPlayerStat.yellowcard,
          redcard: updatedPlayerStat.redcard,
          owngoal: updatedPlayerStat.owngoal,
          goalsconceded: updatedPlayerStat.goalsconceded,
          penaltymissed: updatedPlayerStat.penaltymissed,
          stat: updatedPlayerStat.stat // Keep the stat object for compatibility
        } as any;

        // Recalculate team total points for this game week
        const { totalPoint, players } = await calculate_team_points(team.players);

        // Update the game week team with new points
        await GameWeekTeam.updateTotalGameWeekPointAndPlayers({
          id: team._id,
          total_point: totalPoint,
          players: players,
        });

        // Calculate cumulative total fantasy points across all completed game weeks
        const cumulativeTotal = await calculateCumulativeTeamPoints(team.team_id);

        // Update the main team record with cumulative total
        await TeamDAL.updateFantasyPointAndPlayers({
          id: team.team_id,
          total_fantasy_point: cumulativeTotal,
        });
      }
    }
  } catch (error) {
    console.error('Error recalculating team points:', error);
    throw error;
  }
}

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

// Recalculate team points for a game week after player stats changes
export const recalculateTeamPointsForGameWeek: RequestHandler = async (req, res, next) => {
  try {
    const { gameWeekId } = req.params;

    // Validate game week exists
    const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
    if (!gameWeek) {
      return next(new AppError("Game week not found", 404));
    }

    // Get all teams for this game week
    const count = await GameWeekTeam.countClientsInGameWeek(gameWeek._id);
    if (count === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No teams found for this game week",
        data: { updatedTeams: 0 }
      });
    }

    // Get updated player stats
    const playerStatDoc = await PlayerStat.getPlayerStatsByGameWeek(gameWeekId, undefined, 1, 10000);
    if (!playerStatDoc) {
      return next(new AppError("Player stats not found for this game week", 404));
    }

    const playerStats = playerStatDoc.players;
    console.log(`Found ${playerStats.length} player stats for recalculation`);

    // Process teams in batches
    let page = Math.floor(count / 10);
    if (count % 10 !== 0) {
      page += 1;
    }

    let updatedTeamsCount = 0;
    const teamUpdates: any[] = [];

    for (let i = 1; i <= page; i++) {
      const gameWeekTeams = await GameWeekTeam.getGameweekTeamsForPoint(gameWeek._id, i);
      console.log(`Processing page ${i}, found ${gameWeekTeams.length} teams`);
      
      for (const gameWeekTeam of gameWeekTeams) {
        const oldTotal = gameWeekTeam.total_fantasy_point;
        
        // Update team players with latest calculated points (outer level) and raw stats (stat object)
        const updatedTeamPlayers = gameWeekTeam.players.map((teamPlayer: any) => {
          const latestPlayerStat = playerStats.find((ps: any) => ps.pid.toString() === teamPlayer.pid.toString());
          if (latestPlayerStat) {
            // Calculate minutes played points based on actual minutes played, not fantasy points
            // IMPORTANT: stat.minutesplayed contains actual minutes from raw stats (source of truth)
            // latestPlayerStat.minutesplayed at top level might contain points (0,1,2) from old calculations
            // Always prioritize stat.minutesplayed which is the raw stat value from the API
            const actualMinutesPlayed = latestPlayerStat.stat?.minutesplayed ?? latestPlayerStat.minutesplayed ?? 0;
            let minutesPlayedPoints = 0;
            if (actualMinutesPlayed >= 60) {
              minutesPlayedPoints = 2;
            } else if (actualMinutesPlayed > 0) {
              minutesPlayedPoints = 1;
            }
            
            // Update the team player: outer level = calculated points, stat = raw stats
            return {
              ...teamPlayer,
              // Outer level: calculated fantasy points
              fantasy_point: latestPlayerStat.fantasy_point,
              final_fantasy_point: latestPlayerStat.fantasy_point,
              minutesplayed: minutesPlayedPoints, // Points for minutes (based on actual minutes played)
              goalscored: latestPlayerStat.goalscored * (teamPlayer.position === 'Goalkeeper' ? 10 : teamPlayer.position === 'Defender' ? 6 : teamPlayer.position === 'Midfielder' ? 5 : 4), // Goal points
              assist: (latestPlayerStat.assist || 0) * 3, // Assist points
              cleansheet: (latestPlayerStat.cleansheet || 0) * (teamPlayer.position === 'Goalkeeper' || teamPlayer.position === 'Defender' ? 4 : teamPlayer.position === 'Midfielder' ? 1 : 0),
              shotssaved: Math.floor((latestPlayerStat.shotssaved || 0) / 3), // Save points
              penaltysaved: (latestPlayerStat.penaltysaved || 0) * 5,
              yellowcard: -(latestPlayerStat.yellowcard || 0),
              redcard: -(latestPlayerStat.redcard || 0) * 3,
              owngoal: -(latestPlayerStat.owngoal || 0) * 2,
              goalsconceded: teamPlayer.position === 'Goalkeeper' || teamPlayer.position === 'Defender' ? -Math.floor((latestPlayerStat.goalsconceded || 0) / 2) : 0,
              penaltymissed: -(latestPlayerStat.penaltymissed || 0) * 2,
              // Keep other fields as raw stats (no points calculation)
              passes: latestPlayerStat.passes || 0,
              shotsontarget: latestPlayerStat.shotsontarget || 0,
              tacklesuccessful: latestPlayerStat.tacklesuccessful || 0,
              chancecreated: latestPlayerStat.chancecreated || 0,
              starting: latestPlayerStat.starting11 || 0,
              substitute: latestPlayerStat.substitute || 0,
              blockedshot: 0, // blockedshot not available in IPlayerStat
              interceptionwon: latestPlayerStat.interceptionwon || 0,
              clearance: latestPlayerStat.clearance || 0,
              // stat object: raw stats only (no fantasy_point)
              // Ensure stat.minutesplayed contains actual minutes played, not points
              stat: {
                ...latestPlayerStat.stat,
                minutesplayed: actualMinutesPlayed, // Use actual minutes played from stat or top level
                fantasy_point: undefined // Remove fantasy_point from stat object
              }
            };
          }
          return teamPlayer;
        });
        
        // Calculate team total points directly from updated players
        const { totalPoint, players } = await calculate_team_points(updatedTeamPlayers);

        console.log(`Team ${gameWeekTeam._id}: ${oldTotal} -> ${totalPoint}`);
        
        // Update the team with the latest points
        await GameWeekTeam.updateTotalGameWeekPointAndPlayers({
          id: gameWeekTeam._id,
          total_point: totalPoint,
          players: players,
        });

        // Calculate cumulative total fantasy points across all completed game weeks
        const cumulativeTotal = await calculateCumulativeTeamPoints(gameWeekTeam.team_id);

        // Update players on team with cumulative total
        await TeamDAL.updateFantasyPointAndPlayers({
          id: gameWeekTeam.team_id,
          total_fantasy_point: cumulativeTotal,
        });

        teamUpdates.push({
          teamId: gameWeekTeam._id,
          oldTotal,
          newTotal: totalPoint
        });

        updatedTeamsCount++;
      }
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Team points recalculated successfully",
      data: {
        updatedTeams: updatedTeamsCount,
        totalTeams: count,
        updates: teamUpdates
      }
    });
  } catch (error) {
    console.error('Error in recalculateTeamPointsForGameWeek:', error);
    next(error);
  }
};

// Recalculate all points for a game week (in case of major changes)
export const recalculateGameWeekPoints: RequestHandler = async (req, res, next) => {
  try {
    const { gameWeekId } = req.params;

    // Validate game week exists
    const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
    if (!gameWeek) {
      return next(new AppError("Game week not found", 404));
    }

    // Get all teams for this game week
    const count = await GameWeekTeam.countClientsInGameWeek(gameWeek._id);
    if (count === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "No teams found for this game week",
        data: { updatedTeams: 0 }
      });
    }

    // Get updated player stats
    const playerStatDoc = await PlayerStat.getPlayerStatsByGameWeek(gameWeekId);
    if (!playerStatDoc) {
      return next(new AppError("Player stats not found for this game week", 404));
    }

    const playerStats = playerStatDoc.players;

    // Process teams in batches
    let page = Math.floor(count / 10);
    if (count % 10 !== 0) {
      page += 1;
    }

    let updatedTeamsCount = 0;

    for (let i = 1; i <= page; i++) {
      const gameWeekTeams = await GameWeekTeam.getGameweekTeamsForPoint(gameWeek._id, i);
      
      for (const gameWeekTeam of gameWeekTeams) {
        // Calculate player points with updated stats
        const playersPoints = await calculate_fantasy_points(gameWeekTeam.players, playerStats as any);
        const { totalPoint, players } = await calculate_team_points(playersPoints);

        // Update the team with the latest points
        await GameWeekTeam.updateTotalGameWeekPointAndPlayers({
          id: gameWeekTeam._id,
          total_point: totalPoint,
          players: players,
        });

        // Calculate cumulative total fantasy points across all completed game weeks
        const cumulativeTotal = await calculateCumulativeTeamPoints(gameWeekTeam.team_id);

        // Update players on team with cumulative total
        await TeamDAL.updateFantasyPointAndPlayers({
          id: gameWeekTeam.team_id,
          total_fantasy_point: cumulativeTotal,
        });

        updatedTeamsCount++;
      }
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "All team points recalculated successfully",
      data: {
        updatedTeams: updatedTeamsCount,
        totalTeams: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generate player stats for a game week
export const generatePlayerStats: RequestHandler = async (req, res, next) => {
  try {
    const { gameWeekId } = req.params;

    // Get the game week to validate it exists
    const gameWeek = await GameWeek.getGameWeekById(gameWeekId);
    if (!gameWeek) {
      return next(new AppError("Game week not found", 404));
    }

    // Check if player stats already exist for this game week
    const existingStats = await PlayerStat.getPlayerStatsByGameWeek(gameWeekId);
    if (existingStats) {
      return next(new AppError("Player stats already exist for this game week", 400));
    }

    // Get player stats from game week
    const stat = await GameWeek.getPlayerStat(gameWeek._id);
    if (!stat) {
      return next(new AppError("No player stats available for this game week", 404));
    }

    // Get active roaster
    const activeRoaster = await FantasyRoaster.getFantasyRoaster();
    if (activeRoaster.length === 0) {
      return next(new AppError("No active roaster found", 404));
    }

    // Players from Roaster
    const roasterPlayers = activeRoaster[0].players;

    // Roaster Obj
    let roasterObj: Partial<{ [key: string]: IFantasyRoasterPlayer }> = {};
    roasterPlayers.forEach((player) => {
      roasterObj[player.pid] = player;
    });

    // Fetched stat
    const fetchedStat = JSON.parse(stat);
    fetchedStat.forEach((stat: any) => {
      if (roasterObj[stat.pid]) {
        stat.role = roasterObj[stat.pid]?.role;
      }
    });

    // Calculate fantasy points based on the stat
    const playerStat = await calculate_points(fetchedStat);

    // Check if the players has team name and role
    const validPlayerStat: IPlayerStat[] = [];
    playerStat.forEach((player: IPlayerStat) => {
      if (player.tname && player.position) {
        validPlayerStat.push(player);
      }
    });

    // Create player stats document
    const newPlayerStat = await PlayerStat.createPlayerStat({
      game_week_id: gameWeek._id,
      players: validPlayerStat,
    });

    res.status(201).json({
      status: "SUCCESS",
      message: "Player stats generated successfully",
      data: {
        playerStat: newPlayerStat,
        totalPlayers: validPlayerStat.length
      }
    });
  } catch (error) {
    next(error);
  }
};