import AppError from "../../../utils/app_error";
import { IPlayersData } from "../dto";

// Check player is not in the client's players list
export default function checkNewPlayer(
  playersData: Array<IPlayersData>,
  playerToBeIn: ITeamRequest.ITransferPlayerInput
) {
  const checkNewPlayer = playersData.some((player) => {
    return player.pid === playerToBeIn.pid;
  });
  if (checkNewPlayer) {
    throw new AppError("New player can not be from your team", 400);
  }
}
