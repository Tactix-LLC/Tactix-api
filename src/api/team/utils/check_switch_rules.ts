import AppError from "../../../utils/app_error";
import { IPlayersData } from "../dto";

export default function checkSwitchRules(
  playerToBeOut: IPlayersData,
  playerToBeIn: IPlayersData,
  AllPlayers: Array<IPlayersData>
) {
  // Check player to be out is not bench
  if (playerToBeOut.is_bench) {
    throw new AppError("Player to be out can not be from benches", 400);
  }

  // Check both players don't have the same pid
  if (playerToBeIn.pid === playerToBeOut.pid) {
    throw new AppError("You can not switch a player by himself", 400);
  }

  // Check the player that's going to be in is not a bench
  if (!playerToBeIn.is_bench) {
    throw new AppError("You selected a player that's not a bench", 400);
  }

  // Check both players play in the same position
  if (
    playerToBeOut.position === "Goalkeeper" &&
    playerToBeOut.position !== playerToBeIn.position
  ) {
    throw new AppError("Can not switch a goalkeeper with other positions", 400);
  }

  // Check minimum number of defenders
  const defenders = AllPlayers.filter((player) => {
    return player.position === "Defender" && !player.is_bench;
  });
  if (
    defenders.length === 3 &&
    playerToBeOut.position === "Defender" &&
    playerToBeIn.position !== "Defender"
  ) {
    throw new AppError("At least three defenders are required", 400);
  }

  // Check minimum number of foward
  const forward = AllPlayers.filter((player) => {
    return player.position === "Forward" && !player.is_bench;
  });
  if (
    forward.length === 1 &&
    playerToBeOut.position === "Forward" &&
    playerToBeIn.position !== "Forward"
  ) {
    throw new AppError("At least one forward is required", 400);
  }

  // Set is_bench of the player to be out to true
  playerToBeOut.is_bench = true;

  // Set is_bench of the player to be in to false
  playerToBeIn.is_bench = false;

  // If player to be out was captain, set the player to be in as captain
  if (playerToBeOut.is_captain) {
    playerToBeIn.is_captain = true;
    playerToBeOut.is_captain = false;
  }

  // If player to be out was captain, set the player to be in as captain
  if (playerToBeOut.is_vice_captain) {
    playerToBeIn.is_vice_captain = true;
    playerToBeOut.is_vice_captain = false;
  }
}
