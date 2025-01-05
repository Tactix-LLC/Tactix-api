import AppError from "../../../utils/app_error";
import { IPlayersData } from "../../team/dto";

export default (players: IPlayersData[]) => {
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

  // Get vice captain
  let viceCaptainData: Partial<{
    player: IPlayersData;
    points: number;
    minutesplayed: number;
    position: string;
  }> = {};
  for (const player of players) {
    if (player.is_vice_captain) {
      viceCaptainData.player = player;
      viceCaptainData.points = player.fantasy_point;
      viceCaptainData.minutesplayed = player.minutesplayed;
      viceCaptainData.position = player.position;
      break;
    }
  }

  // Get benches
  const benchPlayers: IPlayersData[] = [];
  let benchGoalKeeper: Partial<IPlayersData> = {};
  for (const player of players) {
    if (player.is_bench && player.position !== "Goalkeeper") {
      benchPlayers.push(player);
    } else if (player.is_bench && player.position === "Goalkeeper") {
      benchGoalKeeper = { ...player };
    }
  }

  // Sort the bench players
  const sortedBenchPlayers = benchPlayers.sort((a, b) => {
    return b.fantasy_point - a.fantasy_point;
  });

  // Get the bench players
  if (benchPlayers.length !== 3)
    throw new AppError(
      "You must have three players on the bench without counting the goalkeeper",
      400
    );

  // Calculate the latest points and push on the final point players array
  for (const player of players) {
    // Switching players other than captain and vice captain
    if (!player.is_captain && !player.is_vice_captain && !player.is_bench) {
      if (sortedBenchPlayers.length > 0) {
        // Switch players other than captian and vice captain
        if (player.minutesplayed <= 0 && player.position !== "Goalkeeper") {
          if (sortedBenchPlayers[0].fantasy_point > 0) {
            player.is_bench = true;
            player.is_switched = true;
            player.switched_by = sortedBenchPlayers[0].full_name;
            const benchPlayer = players.find(
              (player) => sortedBenchPlayers[0].pid === player.pid
            );
            if (benchPlayer) {
              benchPlayer.is_bench = false;
            }
            sortedBenchPlayers.splice(0, 1);
          }
        } else if (
          player.minutesplayed <= 0 &&
          player.position === "Goalkeeper"
        ) {
          if (
            benchGoalKeeper.fantasy_point &&
            benchGoalKeeper.final_fantasy_point &&
            benchGoalKeeper.full_name
          ) {
            if (benchGoalKeeper.fantasy_point > 0) {
              player.is_bench = true;
              player.is_switched = true;
              player.switched_by = benchGoalKeeper.full_name;
              const benchPlayer = players.find(
                (player) => benchGoalKeeper.pid === player.pid
              );
              if (benchPlayer) {
                benchPlayer.is_bench = false;
              }
            }
          }
        }
      }
    }

    // Calculate points for captain and vice captain
    if (player.is_captain || player.is_vice_captain) {
      if (player.is_captain && player.minutesplayed > 0) {
        player.final_fantasy_point = player.fantasy_point * 2;
      } else if (player.is_vice_captain && player.minutesplayed > 0) {
        if (captainData.player && captainData.player.minutesplayed <= 0) {
          player.final_fantasy_point = player.fantasy_point * 2;
        }
      }
    }
  }

  // Change switched players point to 0
  for (const player of players) {
    if (player.is_switched) {
      player.fantasy_point = 0;
      player.final_fantasy_point = 0;
    }
  }

  // Total Point for the game week
  let totalPoint: number = 0;
  for (const player of players) {
    if (!player.is_bench) {
      totalPoint += player.final_fantasy_point;
    }
  }

  return { players, totalPoint };
};
