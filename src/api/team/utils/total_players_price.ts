import { IPlayersData } from "../dto";
import AppError from "../../../utils/app_error";

// Check total price of all players is with the user's budget
export default function checkTotalPlayersPrice(
  playersData: Array<IPlayersData>
): number {
  try {
    const totalPlayersPrice = playersData.reduce(
      (accumulator, player) => accumulator + player.price,
      0
    );

    if (totalPlayersPrice > 100) {
      throw new AppError(
        "You have only 100 tactix coins. Please buy players within your budget",
        400
      );
    }

    // Return total price spent to buy players
    return totalPlayersPrice;
  } catch (error) {
    throw error;
  }
}
