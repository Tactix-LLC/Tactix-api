import { Player } from "../../game_week/dto";
import { IPlayerStat } from "../dto";

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

export default (playerStat: Player[]) => {
  // Players Stat
  const playerStatArr: IPlayerStat[] = [];

  // Loop over the players and calculate the point based on their stat and position
  for (const player of playerStat) {
    const finalData: Partial<IPlayerStat> = {};
    if (player.role === "Goalkeeper" || player.role === "Defender") {
      // For goalkeeper only
      if (player.role === "Goalkeeper") {
        // Shots saved
        finalData.shotssaved =
          player.shotssaved * point_system.shotssaved.point;
        // Penalty saved
        finalData.penaltysaved =
          player.penaltysaved * point_system.penaltysaved.point;
      }
      // Goal scored
      finalData.goalscored =
        player.goalscored * point_system.defender_or_goalkeeper_score.point;
      // Goal conceded
      finalData.goalsconceded =
        Math.floor(player.goalsconceded / point_system.goalsconceded.count) *
        point_system.goalsconceded.point;
      // Cleansheet
      if (player.minutesplayed >= 54) {
        if (player.cleansheet === 1) {
          finalData.cleansheet = point_system.cleansheet.point;
        } else {
          finalData.cleansheet = 0;
        }
      }
    } else if (player.role === "Midfielder") {
      // Goal scored
      finalData.goalscored =
        player.goalscored * point_system.midfielder_score.point;
    } else if (player.role === "Forward") {
      // Goal scored
      finalData.goalscored =
        player.goalscored * point_system.forward_score.point;
    }

    // Assist
    finalData.assist = player.assist * point_system.assist.point;
    // Passes
    finalData.passes =
      Math.floor(player.passes / point_system.passes.count) *
      point_system.passes.point;
    // Shot on target
    finalData.shotsontarget =
      player.shotsontarget * point_system.shotsontarget.point;
    // Tackle won
    finalData.tacklesuccessful =
      player.tacklesuccessful * point_system.tacklesuccessful.point;
    // Yellow card
    finalData.yellowcard = player.yellowcard * point_system.yellowcard.point;
    // Red card
    finalData.redcard = player.redcard * point_system.redcard.point;
    // Own goal
    finalData.owngoal = player.owngoal * point_system.owngoal.point;
    // Penalty missed
    finalData.penaltymissed =
      player.penaltymissed * point_system.penaltymissed.point;
    // Chances created
    finalData.chancecreated =
      Math.floor(player.chancecreated / point_system.chancescreated.count) *
      point_system.chancescreated.point;
    // Starting
    if (player.starting11 === 1) {
      finalData.starting11 = point_system.starting.point;
    }

    // Substitute
    if (player.substitute === 1) {
      finalData.substitute = point_system.substitute.point;
    }
    // Interception won
    finalData.interceptionwon =
      player.interceptionwon * point_system.interceptionwon.point;

    // Minutes played
    finalData.minutesplayed = player.minutesplayed;

    finalData.starting11 = finalData.starting11 ?? 0;
    finalData.substitute = finalData.substitute ?? 0;
    finalData.goalscored = finalData.goalscored ?? 0;
    finalData.goalsconceded = finalData.goalsconceded ?? 0;
    finalData.cleansheet = finalData.cleansheet ?? 0;
    finalData.shotssaved = finalData.shotssaved ?? 0;
    finalData.penaltysaved = finalData.penaltysaved ?? 0;

    // Calculate the fanasy point
    let fantasy_point =
      finalData.assist +
      finalData.passes +
      finalData.shotsontarget +
      finalData.tacklesuccessful +
      finalData.yellowcard +
      finalData.redcard +
      finalData.penaltymissed +
      finalData.chancecreated +
      finalData.starting11 +
      finalData.substitute +
      finalData.interceptionwon +
      finalData.goalscored +
      finalData.goalsconceded +
      finalData.cleansheet +
      finalData.shotssaved +
      finalData.penaltysaved +
      finalData.owngoal;

    // Copy on player stat object
    let playerStatObj = {
      pid: player.pid,
      full_name: player.pname,
      tname: player.tname,
      position: player.role,
      ...finalData,
      fantasy_point,
      stat: { ...player },
    };

    playerStatArr.push(playerStatObj as IPlayerStat);
  }

  return playerStatArr;
};
