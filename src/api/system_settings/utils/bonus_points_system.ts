import { Player } from "../../game_week/dto";
import { IPlayerStat } from "../../players_stat/dto";
import { IPointSystem } from "../model";

/**
 * Bonus Points System (BPS) implementation
 * Based on Premier League Fantasy scoring rules
 * 
 * The BPS utilises a range of statistics to create a BPS score for every player.
 * The three best performing players in each match will be awarded bonus points.
 */
export interface IBPSStats {
  pid: string;
  pname: string;
  role: string;
  bps_score: number;
  // Core BPS statistics
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  saves: number;
  penalty_saves: number;
  // Advanced BPS statistics
  key_passes: number;
  big_chances_created: number;
  big_chances_missed: number;
  recoveries: number;
  clearances: number;
  interceptions: number;
  tackles_won: number;
  aerial_duels_won: number;
  successful_passes: number;
  crosses: number;
  shots_on_target: number;
  // Negative BPS statistics
  goals_conceded: number;
  yellow_cards: number;
  red_cards: number;
  own_goals: number;
  penalty_misses: number;
  errors_leading_to_goal: number;
}

/**
 * Calculate BPS score for a player
 * Based on FPL BPS calculation rules
 */
export function calculateBPSScore(player: Player): IBPSStats {
  const bpsStats: IBPSStats = {
    pid: player.pid,
    pname: player.pname,
    role: player.role,
    bps_score: 0,
    
    // Core stats
    goals_scored: player.goalscored || 0,
    assists: player.assist || 0,
    clean_sheets: player.cleansheet || 0,
    saves: player.shotssaved || 0,
    penalty_saves: player.penaltysaved || 0,
    
    // Advanced stats (these would need to be added to your Player model)
    key_passes: 0, // player.key_passes || 0,
    big_chances_created: 0, // player.big_chances_created || 0,
    big_chances_missed: 0, // player.big_chances_missed || 0,
    recoveries: 0, // player.recoveries || 0,
    clearances: player.clearance || 0,
    interceptions: player.interceptionwon || 0,
    tackles_won: player.tacklesuccessful || 0,
    aerial_duels_won: 0, // player.aerial_duels_won || 0,
    successful_passes: player.passes || 0,
    crosses: 0, // player.crosses || 0,
    shots_on_target: player.shotsontarget || 0,
    
    // Negative stats
    goals_conceded: player.goalsconceded || 0,
    yellow_cards: player.yellowcard || 0,
    red_cards: player.redcard || 0,
    own_goals: player.owngoal || 0,
    penalty_misses: player.penaltymissed || 0,
    errors_leading_to_goal: 0, // player.errors_leading_to_goal || 0,
  };

  // Calculate BPS score based on FPL rules
  bpsStats.bps_score = calculateBPSScoreFromStats(bpsStats);

  return bpsStats;
}

/**
 * Calculate BPS score from player statistics
 * This is a simplified version - the actual FPL BPS is more complex
 */
function calculateBPSScoreFromStats(stats: IBPSStats): number {
  let bpsScore = 0;

  // Goals scored (varies by position)
  switch (stats.role) {
    case "Goalkeeper":
      bpsScore += stats.goals_scored * 12;
      break;
    case "Defender":
      bpsScore += stats.goals_scored * 12;
      break;
    case "Midfielder":
      bpsScore += stats.goals_scored * 18;
      break;
    case "Forward":
      bpsScore += stats.goals_scored * 24;
      break;
  }

  // Assists
  bpsScore += stats.assists * 9;

  // Clean sheets (varies by position)
  if (stats.clean_sheets > 0) {
    switch (stats.role) {
      case "Goalkeeper":
      case "Defender":
        bpsScore += 12;
        break;
      case "Midfielder":
        bpsScore += 6;
        break;
    }
  }

  // Saves (goalkeepers only)
  if (stats.role === "Goalkeeper") {
    bpsScore += Math.floor(stats.saves / 3) * 2;
  }

  // Penalty saves
  bpsScore += stats.penalty_saves * 15;

  // Key passes
  bpsScore += stats.key_passes * 1;

  // Big chances created
  bpsScore += stats.big_chances_created * 3;

  // Recoveries
  bpsScore += Math.floor(stats.recoveries / 3) * 1;

  // Clearances
  bpsScore += Math.floor(stats.clearances / 2) * 1;

  // Interceptions
  bpsScore += Math.floor(stats.interceptions / 2) * 1;

  // Tackles won
  bpsScore += Math.floor(stats.tackles_won / 2) * 1;

  // Aerial duels won
  bpsScore += Math.floor(stats.aerial_duels_won / 3) * 1;

  // Successful passes
  bpsScore += Math.floor(stats.successful_passes / 20) * 1;

  // Crosses
  bpsScore += Math.floor(stats.crosses / 3) * 1;

  // Shots on target
  bpsScore += stats.shots_on_target * 1;

  // Negative points
  bpsScore -= stats.goals_conceded * 1;
  bpsScore -= stats.yellow_cards * 3;
  bpsScore -= stats.red_cards * 6;
  bpsScore -= stats.own_goals * 6;
  bpsScore -= stats.penalty_misses * 6;
  bpsScore -= stats.errors_leading_to_goal * 3;
  bpsScore -= stats.big_chances_missed * 3;

  return Math.max(0, bpsScore); // BPS score cannot be negative
}

/**
 * Award bonus points to the top 3 players in a match
 * Based on FPL bonus point rules
 */
export function awardBonusPoints(
  players: IPlayerStat[],
  pointSystem: IPointSystem
): IPlayerStat[] {
  // Calculate BPS scores for all players
  const playersWithBPS = players.map(player => ({
    ...player,
    bps_score: player.stat ? calculateBPSScore(player.stat).bps_score : 0,
  }));

  // Sort by BPS score (descending)
  playersWithBPS.sort((a, b) => b.bps_score - a.bps_score);

  // Award bonus points
  const updatedPlayers = playersWithBPS.map((player, index) => {
    let bonusPoints = 0;

    if (index === 0) {
      // First place
      bonusPoints = pointSystem.bonus_points.first_place;
    } else if (index === 1) {
      // Second place
      bonusPoints = pointSystem.bonus_points.second_place;
    } else if (index === 2) {
      // Third place
      bonusPoints = pointSystem.bonus_points.third_place;
    }

    // Handle ties (simplified version)
    if (index > 0 && player.bps_score === playersWithBPS[index - 1].bps_score) {
      // If tied with previous player, award same bonus points
      bonusPoints = (playersWithBPS[index - 1] as any).bonus_points || 0;
    }

    return {
      ...player,
      bonus_points: bonusPoints,
      fantasy_point: (player.fantasy_point || 0) + bonusPoints,
    } as any;
  });

  return updatedPlayers;
}

/**
 * Handle bonus point ties according to FPL rules
 * 
 * Examples:
 * - If there is a tie for first place, Players 1 & 2 will receive 3 points each and Player 3 will receive 1 point.
 * - If there is a tie for second place, Player 1 will receive 3 points and Players 2 and 3 will receive 2 points each.
 * - If there is a tie for third place, Player 1 will receive 3 points, Player 2 will receive 2 points and Players 3 & 4 will receive 1 point each.
 */
export function handleBonusPointTies(
  players: IPlayerStat[],
  pointSystem: IPointSystem
): IPlayerStat[] {
  // Group players by BPS score
  const bpsGroups: { [key: number]: IPlayerStat[] } = {};
  
  players.forEach(player => {
    const bpsScore = (player as any).bps_score || 0;
    if (!bpsGroups[bpsScore]) {
      bpsGroups[bpsScore] = [];
    }
    bpsGroups[bpsScore].push(player);
  });

  // Sort BPS scores in descending order
  const sortedBPSScores = Object.keys(bpsGroups)
    .map(Number)
    .sort((a, b) => b - a);

  let bonusPointsAwarded = 0;
  const updatedPlayers: IPlayerStat[] = [];

  for (const bpsScore of sortedBPSScores) {
    const playersWithSameBPS = bpsGroups[bpsScore];
    
    if (bonusPointsAwarded >= 3) {
      // No more bonus points to award
      playersWithSameBPS.forEach(player => {
        updatedPlayers.push({
          ...player,
          bonus_points: 0,
        } as any);
      });
      continue;
    }

    if (playersWithSameBPS.length === 1) {
      // Single player
      const player = playersWithSameBPS[0];
      let bonusPoints = 0;
      
      if (bonusPointsAwarded === 0) {
        bonusPoints = pointSystem.bonus_points.first_place;
      } else if (bonusPointsAwarded === 1) {
        bonusPoints = pointSystem.bonus_points.second_place;
      } else if (bonusPointsAwarded === 2) {
        bonusPoints = pointSystem.bonus_points.third_place;
      }
      
      updatedPlayers.push({
        ...player,
        bonus_points: bonusPoints,
        fantasy_point: (player.fantasy_point || 0) + bonusPoints,
      } as any);
      
      bonusPointsAwarded += 1;
    } else {
      // Multiple players with same BPS
      const remainingBonusSlots = 3 - bonusPointsAwarded;
      
      if (remainingBonusSlots >= playersWithSameBPS.length) {
        // Award points to all tied players
        let bonusPoints = 0;
        
        if (bonusPointsAwarded === 0) {
          bonusPoints = pointSystem.bonus_points.first_place;
        } else if (bonusPointsAwarded === 1) {
          bonusPoints = pointSystem.bonus_points.second_place;
        } else {
          bonusPoints = pointSystem.bonus_points.third_place;
        }
        
        playersWithSameBPS.forEach(player => {
          updatedPlayers.push({
            ...player,
            bonus_points: bonusPoints,
            fantasy_point: (player.fantasy_point || 0) + bonusPoints,
          } as any);
        });
        
        bonusPointsAwarded += playersWithSameBPS.length;
      } else {
        // Award points to some tied players
        const bonusPoints = pointSystem.bonus_points.third_place;
        
        playersWithSameBPS.forEach((player, index) => {
          if (index < remainingBonusSlots) {
            updatedPlayers.push({
              ...player,
              bonus_points: bonusPoints,
              fantasy_point: (player.fantasy_point || 0) + bonusPoints,
            } as any);
          } else {
            updatedPlayers.push({
              ...player,
              bonus_points: 0,
            } as any);
          }
        });
        
        bonusPointsAwarded = 3;
      }
    }
  }

  return updatedPlayers;
}
