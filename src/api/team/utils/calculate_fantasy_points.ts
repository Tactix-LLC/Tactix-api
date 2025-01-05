import { Player } from "../../game_week/dto";
import { IPlayersData } from "../dto";

const point_system = {
  forward_score: {
    count: 1,
    point: 10,
  },
  midfielder_score: {
    count: 1,
    point: 12.5,
  },
  defender_or_goalkeeper_score: {
    count: 1,
    point: 15,
  },
  assist: {
    count: 1,
    point: 5,
  },
  passes: {
    count: 20,
    point: 1,
  },
  shotsontarget: {
    count: 1,
    point: 1.5,
  },
  chancescreated: {
    count: 2,
    point: 1.5,
  },
  interceptionwon: {
    count: 1,
    point: 1,
  },
  tacklesuccessful: {
    count: 1,
    point: 1,
  },
  cleansheet: {
    count: 0,
    point: 5,
  },
  shotssaved: {
    count: 1,
    point: 1.5,
  },
  penaltysaved: {
    count: 1,
    point: 12.5,
  },
  penaltymissed: {
    count: 1,
    point: -5,
  },
  yellowcard: {
    count: 1,
    point: -1,
  },
  redcard: {
    count: 1,
    point: -2.5,
  },
  owngoal: {
    count: 1,
    point: -2,
  },
  goalsconceded: {
    count: 2,
    point: -1,
  },
  starting: {
    count: 0,
    point: 1,
  },
  substitute: {
    count: 0,
    point: 1,
  },
};

export default (
  players: IPlayersData[],
  playerStat: Player[]
): IPlayersData[] => {
  // Latest players object
  let playerStatObj: { [key: string]: Player } = {};
  // Add to the latest players object
  for (const player of playerStat) {
    if (playerStatObj[player.pid]) {
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
        tacklesuccessful:
          existingStat.tacklesuccessful + player.tacklesuccessful,
        yellowcard: existingStat.yellowcard + player.yellowcard,
        redcard: existingStat.redcard + player.redcard,
        owngoal: existingStat.owngoal + player.owngoal,
        penaltymissed: existingStat.penaltymissed + player.penaltymissed,
        chancecreated: existingStat.chancecreated + player.chancecreated,
        starting11: existingStat.starting11 + player.starting11,
        substitute: existingStat.substitute + player.substitute,
        interceptionwon: existingStat.interceptionwon,
      };
      playerStatObj[player.pid] = newStat;
    } else {
      playerStatObj[player.pid] = player;
    }
  }

  // Get the captain
  let captainData: Partial<{
    player: IPlayersData;
    points: number;
    minutesplayed: number;
    position: string;
  }> = {};
  for (const player of players) {
    if (player.is_captain) {
      captainData.player = player;
      captainData.points = player.fantasy_point;
      captainData.minutesplayed = player.minutesplayed;
      captainData.position = player.position;
      break;
    }
  }

  // Loop over the players and calculate the point based on their stat and position
  for (const player of players) {
    const stat = playerStatObj[player.pid];
    if (stat) {
      if (player.position === "Goalkeeper" || player.position === "Defender") {
        // For goalkeeper only
        if (player.position === "Goalkeeper") {
          // Shots saved
          player.shotssaved = stat.shotssaved * point_system.shotssaved.point;
          // Penalty saved
          player.penaltysaved =
            stat.penaltysaved * point_system.penaltysaved.point;
        }
        // Goal scored
        player.goalscored =
          stat.goalscored * point_system.defender_or_goalkeeper_score.point;
        // Goal conceded
        player.goalsconceded =
          Math.floor(stat.goalsconceded / point_system.goalsconceded.count) *
          point_system.goalsconceded.point;
        // Cleansheet
        if (stat.minutesplayed >= 54) {
          if (stat.cleansheet === 1) {
            player.cleansheet = point_system.cleansheet.point;
          } else if (stat.cleansheet === 2) {
            player.cleansheet = point_system.cleansheet.point * 2;
          } else {
            player.cleansheet = 0;
          }
        }
      } else if (player.position === "Midfielder") {
        // Goal scored
        player.goalscored =
          stat.goalscored * point_system.midfielder_score.point;
      } else if (player.position === "Forward") {
        // Goal scored
        player.goalscored = stat.goalscored * point_system.forward_score.point;
      }

      // Assist
      player.assist = stat.assist * point_system.assist.point;
      // Passes
      player.passes =
        Math.floor(stat.passes / point_system.passes.count) *
        point_system.passes.point;
      // Shot on target
      player.shotsontarget =
        stat.shotsontarget * point_system.shotsontarget.point;
      // Tackle won
      player.tacklesuccessful =
        stat.tacklesuccessful * point_system.tacklesuccessful.point;
      // Yellow card
      player.yellowcard = stat.yellowcard * point_system.yellowcard.point;
      // Red card
      player.redcard = stat.redcard * point_system.redcard.point;
      // Own goal
      player.owngoal = stat.owngoal * point_system.owngoal.point;
      // Penalty missed
      player.penaltymissed =
        stat.penaltymissed * point_system.penaltymissed.point;
      // Chances created
      player.chancecreated =
        Math.floor(stat.chancecreated / point_system.chancescreated.count) *
        point_system.chancescreated.point;
      // Starting
      if (stat.starting11 === 1) {
        player.starting = point_system.starting.point;
      } else if (stat.starting11 === 2) {
        player.starting = point_system.starting.point * 2;
      } else {
        player.starting = 0;
      }

      // Substitute
      if (stat.substitute === 1) {
        player.substitute = point_system.substitute.point;
      } else if (stat.substitute === 2) {
        player.substitute = point_system.substitute.point * 2;
      } else {
        player.substitute = 0;
      }
      // Interception won
      player.interceptionwon =
        stat.interceptionwon * point_system.interceptionwon.point;

      // Minutes played
      player.minutesplayed = stat.minutesplayed;

      // Calculate the fanasy point
      player.fantasy_point =
        player.assist +
        player.passes +
        player.shotsontarget +
        player.tacklesuccessful +
        player.yellowcard +
        player.redcard +
        player.penaltymissed +
        player.chancecreated +
        player.starting +
        player.substitute +
        player.interceptionwon +
        player.goalscored +
        player.goalsconceded +
        player.cleansheet +
        player.shotssaved +
        player.penaltysaved +
        player.owngoal;

      player.final_fantasy_point = player.fantasy_point;

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
        if (player.is_captain && player.minutesplayed > 0) {
          player.final_fantasy_point = player.fantasy_point * 2;
        }
      }
    }
  }

  return players;
};
