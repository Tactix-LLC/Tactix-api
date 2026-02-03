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

  // Canonical positions allowed by PlayerStat schema
  const ALLOWED_POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] as const;

  const normalizeRole = (role: string): string => {
    if (!role || typeof role !== 'string') return 'Midfielder';
    const r = role.trim();
    const roleMap: { [key: string]: string } = {
      'GK': 'Goalkeeper', 'G': 'Goalkeeper', 'GOALKEEPER': 'Goalkeeper', 'Goalkeeper': 'Goalkeeper', 'KEEPER': 'Goalkeeper',
      'DEF': 'Defender', 'D': 'Defender', 'DEFENDER': 'Defender', 'Defender': 'Defender',
      'CB': 'Defender', 'LB': 'Defender', 'RB': 'Defender', 'LWB': 'Defender', 'RWB': 'Defender',
      'CENTRE BACK': 'Defender', 'CENTER BACK': 'Defender', 'LEFT BACK': 'Defender', 'RIGHT BACK': 'Defender',
      'FULL BACK': 'Defender', 'WING BACK': 'Defender',
      'MID': 'Midfielder', 'M': 'Midfielder', 'MIDFIELDER': 'Midfielder', 'Midfielder': 'Midfielder',
      'CM': 'Midfielder', 'CDM': 'Midfielder', 'CAM': 'Midfielder', 'LM': 'Midfielder', 'RM': 'Midfielder',
      'CENTRAL MIDFIELDER': 'Midfielder', 'DEFENSIVE MIDFIELDER': 'Midfielder', 'ATTACKING MIDFIELDER': 'Midfielder',
      'LEFT MIDFIELDER': 'Midfielder', 'RIGHT MIDFIELDER': 'Midfielder', 'WINGER': 'Midfielder',
      'LEFT WINGER': 'Midfielder', 'RIGHT WINGER': 'Midfielder',
      'FWD': 'Forward', 'F': 'Forward', 'FORWARD': 'Forward', 'Forward': 'Forward',
      'ST': 'Forward', 'CF': 'Forward', 'SS': 'Forward',
      'STRIKER': 'Forward', 'ATTACKER': 'Forward', 'CENTRE FORWARD': 'Forward', 'CENTER FORWARD': 'Forward',
      'SECOND STRIKER': 'Forward', 'LEFT WING': 'Forward', 'RIGHT WING': 'Forward',
    };
    const upper = r.toUpperCase();
    const normalized = roleMap[upper] || roleMap[r] || roleMap[r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()] || r;
    return ALLOWED_POSITIONS.includes(normalized as any) ? normalized : 'Midfielder';
  };

  // Loop over players and calculate points based on FPL rules
  for (const player of playerStat) {
    const finalData: any = {};
    
    // Normalize player role to full name format
    const normalizedRole = normalizeRole(player.role || 'Midfielder');
    
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
      switch (normalizedRole) {
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
      switch (normalizedRole) {
        case "Goalkeeper":
          finalData.cleansheet = pointSystem.goalkeeper_clean_sheet;
          break;
        case "Defender":
          finalData.cleansheet = pointSystem.defender_clean_sheet;
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
    if (normalizedRole === "Goalkeeper") {
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

    // Defensive contributions removed - not part of the point system
    finalData.defensive_contributions = 0;

    // Calculate penalty points (always negative)
    const penaltyMissPenalty = player.penaltymissed * Math.abs(pointSystem.penalty_miss || 2);
    finalData.penaltymissed = -penaltyMissPenalty; // Ensure negative

    // Calculate card points (always negative)
    const yellowCardPenalty = player.yellowcard * Math.abs(pointSystem.yellow_card || 1);
    finalData.yellowcard = -yellowCardPenalty; // Ensure negative
    const redCardPenalty = player.redcard * Math.abs(pointSystem.red_card || 3);
    finalData.redcard = -redCardPenalty; // Ensure negative

    // Calculate own goal points (always negative)
    const ownGoalPenalty = player.owngoal * Math.abs(pointSystem.own_goal || 2);
    finalData.owngoal = -ownGoalPenalty; // Ensure negative
    
    // Goals conceded (for goalkeepers and defenders) (always negative)
    if (normalizedRole === "Goalkeeper" || normalizedRole === "Defender") {
      const goalsConcededPenalty = Math.floor(player.goalsconceded / 2) * Math.abs(pointSystem.goals_conceded_per_2 || 1);
      finalData.goalsconceded = -goalsConcededPenalty; // Ensure negative
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
    finalData.defensive_contributions = 0; // Not part of point system
    finalData.penaltymissed = finalData.penaltymissed ?? 0;
    finalData.yellowcard = finalData.yellowcard ?? 0;
    finalData.redcard = finalData.redcard ?? 0;
    finalData.owngoal = finalData.owngoal ?? 0;
    finalData.goalsconceded = finalData.goalsconceded ?? 0;

    // Calculate total fantasy points (defensive contributions excluded)
    const fantasy_point = (
      (finalData.playing_time || 0) +
      (finalData.goalscored || 0) +
      (finalData.assist || 0) +
      (finalData.cleansheet || 0) +
      (finalData.shotssaved || 0) +
      (finalData.penaltysaved || 0) +
      (finalData.penaltymissed || 0) +
      (finalData.yellowcard || 0) +
      (finalData.redcard || 0) +
      (finalData.owngoal || 0) +
      (finalData.goalsconceded || 0)
    );

    // Create player stat object
    // Use normalizedRole for position (PlayerStat expects: Goalkeeper, Defender, Midfielder, Forward)
    const playerStatObj: IPlayerStat = {
      pid: player.pid,
      full_name: player.pname,
      tname: player.tname,
      position: normalizedRole,
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
