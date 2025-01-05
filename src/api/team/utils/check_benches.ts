import { IPlayersData } from "../dto";
import AppError from "../../../utils/app_error";

// Check benches
export default function checkBenches(playersData: Array<IPlayersData>) {
  try {
    const benches = playersData.filter((player) => player.is_bench === true);

    if (benches.length !== 4)
      throw new AppError(
        "You can not have more or less than four benches",
        400
      );

    // Check there's only one goal keeper
    const goalKeeper = benches.filter(
      (bench) => bench.position === "Goalkeeper"
    );
    if (goalKeeper.length != 1)
      throw new AppError(
        "You must have only one goal keeper as bench player",
        400
      );

    // Check captain and vice captain are not benches
    if (
      benches.every((bench) => bench.is_captain === true) ||
      benches.every((bench) => bench.is_vice_captain === true)
    ) {
      throw new AppError(
        "You can not have your captain and vice captain as bench players",
        400
      );
    }
  } catch (error) {
    throw error;
  }
}
