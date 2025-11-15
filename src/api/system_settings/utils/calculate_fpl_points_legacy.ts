import { Player } from "../../game_week/dto";
import { IPlayersData } from "../../team/dto";
import SystemSettings from "../model";

/**
 * Calculate fantasy points using FPL-compatible system (Legacy compatibility)
 * This replaces the old calculate_fantasy_points function
 */
export default async (
  players: IPlayersData[],
  playerStat: Player[]
): Promise<IPlayersData[]> => {
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
  
  // Create player stat lookup object
  let playerStatObj: { [key: string]: Player } = {};
  for (const player of playerStat) {
    if (playerStatObj[player.pid]) {
      // Aggregate stats for players with multiple matches
      let existingStat = { ...playerStatObj[player.pid] };
      let newStat: Player = {
        pid: existingStat.pid,
        pname: existingStat.pname,
        role: existingStat.role,
        tname: existingStat.tname,
        point: existingStat.point + player.point,
        blockedshot: existingStat.blockedshot + player.blockedshot,
        clearance: existingStat.clearance + player.clearance,
        shotssaved: existingStat.shotssaved + player.shotssaved,
        penaltysaved: existingStat.penaltysaved + player.penaltysaved,
        goalscored: existingStat.goalscored + player.goalscored,
        goalsconceded: existingStat.goalsconceded + player.goalsconceded,
        minutesplayed: existingStat.minutesplayed + player.minutesplayed,
        cleansheet: existingStat.cleansheet + player.cleansheet,
        assist: existingStat.assist + player.assist,
        passes: existingStat.passes + player.passes,
        shotsontarget: existingStat.shotsontarget + player.shotsontarget,
        tacklesuccessful: existingStat.tacklesuccessful + player.tacklesuccessful,
        yellowcard: existingStat.yellowcard + player.yellowcard,
        redcard: existingStat.redcard + player.redcard,
        owngoal: existingStat.owngoal + player.owngoal,
        penaltymissed: existingStat.penaltymissed + player.penaltymissed,
        chancecreated: existingStat.chancecreated + player.chancecreated,
        starting11: existingStat.starting11 + player.starting11,
        substitute: existingStat.substitute + player.substitute,
        interceptionwon: existingStat.interceptionwon + player.interceptionwon,
      };
      playerStatObj[player.pid] = newStat;
    } else {
      playerStatObj[player.pid] = player;
    }
  }

  // Get captain data
  let captainData: { player: IPlayersData | null; viceCaptain: IPlayersData | null } = {
    player: null,
    viceCaptain: null,
  };

  // Find captain and vice captain
  for (const player of players) {
    if (player.is_captain) {
      captainData.player = player;
    }
    if (player.is_vice_captain) {
      captainData.viceCaptain = player;
    }
  }

  // Calculate points for each player
  for (const player of players) {
    const stat = playerStatObj[player.pid];
    if (stat) {
      // Calculate FPL-compatible points
      let fantasy_point = 0;

      // Playing time points
      if (stat.minutesplayed >= 60) {
        fantasy_point += pointSystem.playing_60_plus_minutes;
      } else if (stat.minutesplayed > 0) {
        fantasy_point += pointSystem.playing_under_60_minutes;
      }

      // Goal points by position
      if (stat.goalscored > 0) {
        switch (stat.role) {
          case "Goalkeeper":
            fantasy_point += stat.goalscored * pointSystem.goalkeeper_goal;
            break;
          case "Defender":
            fantasy_point += stat.goalscored * pointSystem.defender_goal;
            break;
          case "Midfielder":
            fantasy_point += stat.goalscored * pointSystem.midfielder_goal;
            break;
          case "Forward":
            fantasy_point += stat.goalscored * pointSystem.forward_goal;
            break;
        }
      }

      // Assist points
      fantasy_point += stat.assist * pointSystem.assist;

      // Clean sheet points (only if played 60+ minutes)
      if (stat.minutesplayed >= 60 && stat.cleansheet === 1) {
        switch (stat.role) {
          case "Goalkeeper":
            fantasy_point += pointSystem.goalkeeper_clean_sheet;
            break;
          case "Defender":
            fantasy_point += pointSystem.defender_clean_sheet;
            break;
          case "Midfielder":
            fantasy_point += pointSystem.midfielder_clean_sheet;
            break;
        }
      }

      // Goalkeeper specific points
      if (stat.role === "Goalkeeper") {
        // Saves: 1 point for every 3 saves
        fantasy_point += Math.floor(stat.shotssaved / 3) * pointSystem.saves_per_3;
        // Penalty saves
        fantasy_point += stat.penaltysaved * pointSystem.penalty_save;
      }

      // Defensive contributions (NEW for 2025/26)
      let totalDefensiveContributions = (stat.tacklesuccessful || 0) + (stat.interceptionwon || 0) + (stat.clearance || 0);
      switch (stat.role) {
        case "Defender":
          if (totalDefensiveContributions >= pointSystem.defender_defensive_contributions.threshold) {
            fantasy_point += pointSystem.defender_defensive_contributions.points;
          }
          break;
        case "Midfielder":
          if (totalDefensiveContributions >= pointSystem.midfielder_defensive_contributions.threshold) {
            fantasy_point += pointSystem.midfielder_defensive_contributions.points;
          }
          break;
        case "Forward":
          if (totalDefensiveContributions >= pointSystem.forward_defensive_contributions.threshold) {
            fantasy_point += pointSystem.forward_defensive_contributions.points;
          }
          break;
      }

      // Penalty points
      fantasy_point += stat.penaltymissed * pointSystem.penalty_miss;

      // Card points
      fantasy_point += stat.yellowcard * pointSystem.yellow_card;
      fantasy_point += stat.redcard * pointSystem.red_card;

      // Other points
      fantasy_point += stat.owngoal * pointSystem.own_goal;
      
      // Goals conceded (for goalkeepers and defenders)
      if (stat.role === "Goalkeeper" || stat.role === "Defender") {
        fantasy_point += Math.floor(stat.goalsconceded / 2) * pointSystem.goals_conceded_per_2;
      }

      // Set the calculated points
      player.fantasy_point = fantasy_point;
      player.final_fantasy_point = fantasy_point;

      // Calculate individual point values for direct properties (these show points, not raw stats)
      
      // Playing time points
      let playingTimePoints = 0;
      if (stat.minutesplayed >= 60) {
        playingTimePoints = pointSystem.playing_60_plus_minutes;
      } else if (stat.minutesplayed > 0) {
        playingTimePoints = pointSystem.playing_under_60_minutes;
      }
      player.minutesplayed = playingTimePoints;

      // Goal points by position
      let goalPoints = 0;
      if (stat.goalscored > 0) {
        switch (stat.role) {
          case "Goalkeeper":
            goalPoints = stat.goalscored * pointSystem.goalkeeper_goal;
            break;
          case "Defender":
            goalPoints = stat.goalscored * pointSystem.defender_goal;
            break;
          case "Midfielder":
            goalPoints = stat.goalscored * pointSystem.midfielder_goal;
            break;
          case "Forward":
            goalPoints = stat.goalscored * pointSystem.forward_goal;
            break;
        }
      }
      player.goalscored = goalPoints;

      // Assist points
      player.assist = stat.assist * pointSystem.assist;

      // Clean sheet points
      let cleanSheetPoints = 0;
      if (stat.minutesplayed >= 60 && stat.cleansheet === 1) {
        switch (stat.role) {
          case "Goalkeeper":
            cleanSheetPoints = pointSystem.goalkeeper_clean_sheet;
            break;
          case "Defender":
            cleanSheetPoints = pointSystem.defender_clean_sheet;
            break;
          case "Midfielder":
            cleanSheetPoints = pointSystem.midfielder_clean_sheet;
            break;
        }
      }
      player.cleansheet = cleanSheetPoints;

      // Goalkeeper specific points
      let shotsSavedPoints = 0;
      let penaltySavedPoints = 0;
      if (stat.role === "Goalkeeper") {
        shotsSavedPoints = Math.floor(stat.shotssaved / 3) * pointSystem.saves_per_3;
        penaltySavedPoints = stat.penaltysaved * pointSystem.penalty_save;
      }
      player.shotssaved = shotsSavedPoints;
      player.penaltysaved = penaltySavedPoints;

      // Defensive contributions
      let playerDefensiveContributions = (stat.tacklesuccessful || 0) + (stat.interceptionwon || 0) + (stat.clearance || 0);
      let defensivePoints = 0;
      switch (stat.role) {
        case "Defender":
          if (playerDefensiveContributions >= pointSystem.defender_defensive_contributions.threshold) {
            defensivePoints = pointSystem.defender_defensive_contributions.points;
          }
          break;
        case "Midfielder":
          if (playerDefensiveContributions >= pointSystem.midfielder_defensive_contributions.threshold) {
            defensivePoints = pointSystem.midfielder_defensive_contributions.points;
          }
          break;
        case "Forward":
          if (playerDefensiveContributions >= pointSystem.forward_defensive_contributions.threshold) {
            defensivePoints = pointSystem.forward_defensive_contributions.points;
          }
          break;
      }
      player.tacklesuccessful = defensivePoints;

      // Penalty miss points
      player.penaltymissed = stat.penaltymissed * pointSystem.penalty_miss;

      // Card points
      player.yellowcard = stat.yellowcard * pointSystem.yellow_card;
      player.redcard = stat.redcard * pointSystem.red_card;

      // Own goal points
      player.owngoal = stat.owngoal * pointSystem.own_goal;

      // Goals conceded points
      let goalsConcededPoints = 0;
      if (stat.role === "Goalkeeper" || stat.role === "Defender") {
        goalsConcededPoints = Math.floor(stat.goalsconceded / 2) * pointSystem.goals_conceded_per_2;
      }
      player.goalsconceded = goalsConcededPoints;

      // Set raw stats for display purposes (these show actual stats, not points)
      player.passes = stat.passes;
      player.shotsontarget = stat.shotsontarget;
      player.chancecreated = stat.chancecreated;
      player.starting = stat.starting11;
      player.substitute = stat.substitute;
      player.blockedshot = stat.blockedshot;
      player.interceptionwon = stat.interceptionwon;
      player.clearance = stat.clearance;

      // Add stat on the player
      player.stat = { ...stat };
      if (player.stat.starting11 === 2) {
        player.stat.starting11 = 1;
      }
      if (player.stat.substitute === 2) {
        player.stat.substitute = 1;
      }
      if (player.stat.cleansheet === 2) {
        player.stat.cleansheet = 1;
      }

      // Calculate points for captain and vice captain
      if (player.is_captain) {
        if (player.stat.minutesplayed > 0) {
          player.final_fantasy_point = player.fantasy_point * 2;
        } else {
          player.final_fantasy_point = player.fantasy_point;
        }
      } else if (player.is_vice_captain) {
        // Vice-captain only gets double points if captain didn't play (0 minutes)
        if (captainData.player && captainData.player.stat && captainData.player.stat.minutesplayed <= 0 && player.stat.minutesplayed > 0) {
          player.final_fantasy_point = player.fantasy_point * 2;
        } else {
          player.final_fantasy_point = player.fantasy_point;
        }
      } else {
        // Regular players get their base points
        player.final_fantasy_point = player.fantasy_point;
      }
    } else {
      // Player has no stats (didn't play or bench player)
      player.fantasy_point = 0;
      player.final_fantasy_point = 0;
      
      // Set all point values to 0 for direct properties
      player.minutesplayed = 0;
      player.goalscored = 0;
      player.assist = 0;
      player.cleansheet = 0;
      player.shotssaved = 0;
      player.penaltysaved = 0;
      player.tacklesuccessful = 0;
      player.yellowcard = 0;
      player.redcard = 0;
      player.owngoal = 0;
      player.goalsconceded = 0;
      player.penaltymissed = 0;
      
      // Set raw stats to 0
      player.passes = 0;
      player.shotsontarget = 0;
      player.chancecreated = 0;
      player.starting = 0;
      player.substitute = 0;
      player.blockedshot = 0;
      player.interceptionwon = 0;
      player.clearance = 0;

      // Set empty stat object for consistency
      player.stat = {
        pid: player.pid,
        pname: player.full_name,
        role: player.position,
        tname: "",
        point: 0,
        minutesplayed: 0,
        goalscored: 0,
        assist: 0,
        passes: 0,
        shotsontarget: 0,
        cleansheet: 0,
        shotssaved: 0,
        penaltysaved: 0,
        tacklesuccessful: 0,
        yellowcard: 0,
        redcard: 0,
        owngoal: 0,
        goalsconceded: 0,
        penaltymissed: 0,
        chancecreated: 0,
        starting11: 0,
        substitute: 0,
        blockedshot: 0,
        interceptionwon: 0,
        clearance: 0
      };
    }
  }

  return players;
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
