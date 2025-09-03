import { Player } from "../../game_week/dto";
import { IPlayerStat } from "../dto";
import SystemSettings from "../../system_settings/model";

/**
 * Calculate fantasy points using FPL-compatible system for player stats
 * This replaces the old calculate_points function
 */
export default async (playerStat: Player[]): Promise<IPlayerStat[]> => {
  // Get system settings
  let settings;
  try {
    settings = await SystemSettings.findOne().sort({ created_at: -1 });
    if (!settings) {
      settings = await SystemSettings.create({});
    }
  } catch (error) {
    console.error('Error getting system settings:', error);
    // Fallback to default FPL rules
    settings = { point_system: getDefaultPointSystem() };
  }

  const pointSystem = settings.point_system;
  const playerStatArr: IPlayerStat[] = [];

  // Loop over players and calculate points based on FPL rules
  for (const player of playerStat) {
    const finalData: any = {};
    
    // Calculate playing time points
    if (player.minutesplayed >= 60) {
      finalData.playing_time = pointSystem.playing_60_plus_minutes;
    } else if (player.minutesplayed > 0) {
      finalData.playing_time = pointSystem.playing_under_60_minutes;
    } else {
      finalData.playing_time = 0;
    }

    // Calculate goal points by position
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

    // Calculate assist points
    finalData.assist = player.assist * pointSystem.assist;

    // Calculate clean sheet points
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

    // Calculate goalkeeper specific points
    if (player.role === "Goalkeeper") {
      // Saves: 1 point for every 3 saves
      if (player.shotssaved > 0) {
        finalData.shotssaved = Math.floor(player.shotssaved / 3) * pointSystem.saves_per_3;
      } else {
        finalData.shotssaved = 0;
      }
      // Penalty saves
      finalData.penaltysaved = player.penaltysaved * pointSystem.penalty_save;
    } else {
      finalData.shotssaved = 0;
      finalData.penaltysaved = 0;
    }

    // Calculate defensive contributions (NEW for 2025/26)
    let defensiveContributions = (player.tacklesuccessful || 0) + (player.interceptionwon || 0) + (player.clearance || 0);
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

    // Calculate penalty points
    finalData.penaltymissed = player.penaltymissed * pointSystem.penalty_miss;

    // Calculate card points
    finalData.yellowcard = player.yellowcard * pointSystem.yellow_card;
    finalData.redcard = player.redcard * pointSystem.red_card;

    // Calculate other points
    finalData.owngoal = player.owngoal * pointSystem.own_goal;
    
    // Goals conceded (for goalkeepers and defenders)
    if (player.role === "Goalkeeper" || player.role === "Defender") {
      finalData.goalsconceded = Math.floor(player.goalsconceded / 2) * pointSystem.goals_conceded_per_2;
    } else {
      finalData.goalsconceded = 0;
    }

    // Set default values
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

    // Calculate total fantasy points
    const fantasy_point = (
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
 * Default FPL point system (fallback)
 */
function getDefaultPointSystem() {
  return {
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
  };
}
