import { Player } from "../../game_week/dto";
import { IPlayerStat } from "../../players_stat/dto";
import { ISystemSettings, IPointSystem } from "../model";

/**
 * Calculate fantasy points using FPL-compatible system
 * Based on Premier League Fantasy scoring rules
 */
export default async (
  playerStat: Player[],
  systemSettings?: ISystemSettings
): Promise<IPlayerStat[]> => {
  // Get system settings (with fallback to default FPL rules)
  const settings = systemSettings || await getDefaultSettings();
  const pointSystem = settings.point_system;
  
  const playerStatArr: IPlayerStat[] = [];

  // Loop over players and calculate points based on FPL rules
  for (const player of playerStat) {
    const finalData: any = {};
    
    // Calculate playing time points
    calculatePlayingTimePoints(player, finalData, pointSystem);
    
    // Calculate goal points by position
    calculateGoalPoints(player, finalData, pointSystem);
    
    // Calculate assist points
    calculateAssistPoints(player, finalData, pointSystem);
    
    // Calculate clean sheet points
    calculateCleanSheetPoints(player, finalData, pointSystem);
    
    // Calculate goalkeeper specific points
    if (player.role === "Goalkeeper") {
      calculateGoalkeeperPoints(player, finalData, pointSystem);
    }
    
    // Calculate defensive contributions (NEW for 2025/26)
    calculateDefensiveContributions(player, finalData, pointSystem);
    
    // Calculate penalty points
    calculatePenaltyPoints(player, finalData, pointSystem);
    
    // Calculate card points
    calculateCardPoints(player, finalData, pointSystem);
    
    // Calculate other points
    calculateOtherPoints(player, finalData, pointSystem);
    
    // Set default values
    setDefaultValues(finalData);
    
    // Calculate total fantasy points
    const fantasy_point = calculateTotalPoints(finalData);
    
    // Create player stat object
    const playerStatObj: IPlayerStat = {
      pid: player.pid,
      full_name: player.pname,
      tname: player.tname,
      position: player.role,
      ...finalData,
      fantasy_point,
      stat: { ...player },
    } as IPlayerStat;

    playerStatArr.push(playerStatObj);
  }

  return playerStatArr;
};

/**
 * Calculate playing time points
 */
function calculatePlayingTimePoints(
  player: Player,
  finalData: any,
  pointSystem: IPointSystem
): void {
  if (player.minutesplayed >= 60) {
    finalData.playing_time = pointSystem.playing_60_plus_minutes;
  } else if (player.minutesplayed > 0) {
    finalData.playing_time = pointSystem.playing_under_60_minutes;
  } else {
    finalData.playing_time = 0;
  }
}

/**
 * Calculate goal points based on position
 */
function calculateGoalPoints(
  player: Player,
  finalData: Partial<IPlayerStat>,
  pointSystem: IPointSystem
): void {
  if (player.goalscored > 0) {
    switch (player.role) {
      case "Goalkeeper":
        finalData.goalscored = player.goalscored * pointSystem.goalkeeper_goal;
        break;
      case "Defender":
        finalData.goalscored = player.goalscored * pointSystem.defender_goal;
        break;
      case "Midfielder":
        finalData.goalscored = player.goalscored * pointSystem.midfielder_goal;
        break;
      case "Forward":
        finalData.goalscored = player.goalscored * pointSystem.forward_goal;
        break;
      default:
        finalData.goalscored = 0;
    }
  } else {
    finalData.goalscored = 0;
  }
}

/**
 * Calculate assist points
 */
function calculateAssistPoints(
  player: Player,
  finalData: Partial<IPlayerStat>,
  pointSystem: IPointSystem
): void {
  finalData.assist = player.assist * pointSystem.assist;
}

/**
 * Calculate clean sheet points
 */
function calculateCleanSheetPoints(
  player: Player,
  finalData: Partial<IPlayerStat>,
  pointSystem: IPointSystem
): void {
  // Clean sheet only counts if player played 60+ minutes
  if (player.minutesplayed >= 60 && player.cleansheet === 1) {
    switch (player.role) {
      case "Goalkeeper":
      case "Defender":
        finalData.cleansheet = pointSystem.goalkeeper_clean_sheet;
        break;
      case "Midfielder":
        finalData.cleansheet = pointSystem.midfielder_clean_sheet;
        break;
      default:
        finalData.cleansheet = 0;
    }
  } else {
    finalData.cleansheet = 0;
  }
}

/**
 * Calculate goalkeeper specific points
 */
function calculateGoalkeeperPoints(
  player: Player,
  finalData: Partial<IPlayerStat>,
  pointSystem: IPointSystem
): void {
  // Saves: 1 point for every 3 saves
  if (player.shotssaved > 0) {
    finalData.shotssaved = Math.floor(player.shotssaved / 3) * pointSystem.saves_per_3;
  } else {
    finalData.shotssaved = 0;
  }
  
  // Penalty saves
  finalData.penaltysaved = player.penaltysaved * pointSystem.penalty_save;
}

/**
 * Calculate defensive contributions (NEW for 2025/26)
 */
function calculateDefensiveContributions(
  player: Player,
  finalData: any,
  pointSystem: IPointSystem
): void {
  // This would need to be calculated based on actual defensive stats
  // For now, we'll use a placeholder calculation
  let defensiveContributions = 0;
  
  // Calculate based on tackles, interceptions, clearances, etc.
  defensiveContributions = (player.tacklesuccessful || 0) + (player.interceptionwon || 0) + (player.clearance || 0);
  
  switch (player.role) {
    case "Defender":
      if (defensiveContributions >= pointSystem.defender_defensive_contributions.threshold) {
        finalData.defensive_contributions = pointSystem.defender_defensive_contributions.points;
      } else {
        finalData.defensive_contributions = 0;
      }
      break;
    case "Midfielder":
      if (defensiveContributions >= pointSystem.midfielder_defensive_contributions.threshold) {
        finalData.defensive_contributions = pointSystem.midfielder_defensive_contributions.points;
      } else {
        finalData.defensive_contributions = 0;
      }
      break;
    case "Forward":
      if (defensiveContributions >= pointSystem.forward_defensive_contributions.threshold) {
        finalData.defensive_contributions = pointSystem.forward_defensive_contributions.points;
      } else {
        finalData.defensive_contributions = 0;
      }
      break;
    default:
      finalData.defensive_contributions = 0;
  }
}

/**
 * Calculate penalty points
 */
function calculatePenaltyPoints(
  player: Player,
  finalData: Partial<IPlayerStat>,
  pointSystem: IPointSystem
): void {
  finalData.penaltymissed = player.penaltymissed * pointSystem.penalty_miss;
}

/**
 * Calculate card points
 */
function calculateCardPoints(
  player: Player,
  finalData: Partial<IPlayerStat>,
  pointSystem: IPointSystem
): void {
  finalData.yellowcard = player.yellowcard * pointSystem.yellow_card;
  finalData.redcard = player.redcard * pointSystem.red_card;
}

/**
 * Calculate other points (own goals, goals conceded)
 */
function calculateOtherPoints(
  player: Player,
  finalData: Partial<IPlayerStat>,
  pointSystem: IPointSystem
): void {
  // Own goals
  finalData.owngoal = player.owngoal * pointSystem.own_goal;
  
  // Goals conceded (for goalkeepers and defenders)
  if (player.role === "Goalkeeper" || player.role === "Defender") {
    finalData.goalsconceded = Math.floor(player.goalsconceded / 2) * pointSystem.goals_conceded_per_2;
  } else {
    finalData.goalsconceded = 0;
  }
}

/**
 * Set default values for undefined fields
 */
function setDefaultValues(finalData: any): void {
  finalData.playing_time = finalData.playing_time ?? 0;
  finalData.goalscored = finalData.goalscored ?? 0;
  finalData.assist = finalData.assist ?? 0;
  finalData.cleansheet = finalData.cleansheet ?? 0;
  finalData.shotssaved = finalData.shotssaved ?? 0;
  finalData.penaltysaved = finalData.penaltysaved ?? 0;
  finalData.defensive_contributions = finalData.defensive_contributions ?? 0;
  finalData.penaltymissed = finalData.penaltymissed ?? 0;
  finalData.yellowcard = finalData.yellowcard ?? 0;
  finalData.redcard = finalData.redcard ?? 0;
  finalData.owngoal = finalData.owngoal ?? 0;
  finalData.goalsconceded = finalData.goalsconceded ?? 0;
}

/**
 * Calculate total fantasy points
 */
function calculateTotalPoints(finalData: any): number {
  return (
    (finalData.playing_time || 0) +
    (finalData.goalscored || 0) +
    (finalData.assist || 0) +
    (finalData.cleansheet || 0) +
    (finalData.shotssaved || 0) +
    (finalData.penaltysaved || 0) +
    (finalData.defensive_contributions || 0) +
    (finalData.penaltymissed || 0) +
    (finalData.yellowcard || 0) +
    (finalData.redcard || 0) +
    (finalData.owngoal || 0) +
    (finalData.goalsconceded || 0)
  );
}

/**
 * Get default system settings (fallback)
 */
async function getDefaultSettings(): Promise<ISystemSettings> {
  // This would typically fetch from database or Redis cache
  // For now, return a mock object with default FPL rules
  return {
    point_system: {
      playing_under_60_minutes: 1,
      playing_60_plus_minutes: 2,
      goalkeeper_goal: 10,
      defender_goal: 6,
      midfielder_goal: 5,
      forward_goal: 4,
      assist: 3,
      goalkeeper_clean_sheet: 4,
      defender_clean_sheet: 4,
      midfielder_clean_sheet: 1,
      saves_per_3: 1,
      penalty_save: 5,
      defender_defensive_contributions: { threshold: 10, points: 2 },
      midfielder_defensive_contributions: { threshold: 12, points: 2 },
      forward_defensive_contributions: { threshold: 12, points: 2 },
      penalty_miss: -2,
      yellow_card: -1,
      red_card: -3,
      own_goal: -2,
      goals_conceded_per_2: -1,
      bonus_points: { first_place: 3, second_place: 2, third_place: 1 },
    },
  } as ISystemSettings;
}
