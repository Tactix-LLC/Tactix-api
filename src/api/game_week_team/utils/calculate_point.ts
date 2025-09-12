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

  // Get vice captain data
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

  // Calculate the latest points and push on the final point players array
  for (const player of players) {
    // Calculate points for captain and vice captain
    if (player.is_captain) {
      if (player.minutesplayed > 0) {
        player.final_fantasy_point = player.fantasy_point * 2;
      }
    } else if (player.is_vice_captain) {
      // Vice-captain only gets double points if captain didn't play (0 minutes)
      if (captainData.player && captainData.player.minutesplayed <= 0 && player.minutesplayed > 0) {
        player.final_fantasy_point = player.fantasy_point * 2;
      }
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
