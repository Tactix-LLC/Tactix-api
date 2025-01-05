import { IPlayersData } from "../dto";
import AppError from "../../../utils/app_error";

// Number of allowed players at each position
export default function checkNumOfPlayersAtEachPosition(
  playersData: Array<IPlayersData>
) {
  try {
    // Check there're 2 goal keepers out of the total 15 players
    if (
      playersData.filter((player) => player.position === "Goalkeeper")
        .length !== 2
    ) {
      throw new AppError("Please select two goal keepers", 400);
    }

    // Check there're 5 defenders out of the total 15 players
    if (
      playersData.filter((player) => player.position === "Defender").length !==
      5
    ) {
      throw new AppError("Please select five defenders", 400);
    }

    // Check there're 5 midfielders out of the total 15 players
    if (
      playersData.filter((player) => player.position === "Midfielder")
        .length !== 5
    ) {
      throw new AppError("Please select five midfielders", 400);
    }

    // Check there're 3 forwarders out of the total 15 players
    if (
      playersData.filter((player) => player.position === "Forward").length !== 3
    ) {
      throw new AppError("Please select three forwarders", 400);
    }
  } catch (error) {
    throw error;
  }
}
