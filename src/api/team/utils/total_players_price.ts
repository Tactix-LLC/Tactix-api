import { IPlayersData } from "../dto";
import AppError from "../../../utils/app_error";

// Check total price of all players is with the user's budget
export default function checkTotalPlayersPrice(
  playersData: Array<IPlayersData>
): number {
  try {
    console.log("=== TEAM PRICE VALIDATION DEBUG ===");
    console.log("Number of players:", playersData.length);
    console.log("Players data:", JSON.stringify(playersData, null, 2));
    
    const totalPlayersPrice = playersData.reduce(
      (accumulator, player) => {
        console.log(`Player: ${player.full_name}, Price: ${player.price}, Position: ${player.position}`);
        return accumulator + player.price;
      },
      0
    );

    console.log("Total players price:", totalPlayersPrice);
    console.log("Budget limit: 100");
    console.log("Price within budget:", totalPlayersPrice <= 100);

    if (totalPlayersPrice > 100) {
      console.log("❌ VALIDATION FAILED: Total price exceeds budget");
      throw new AppError(
        "You have only 100 tactix coins. Please buy players within your budget",
        400
      );
    }

    console.log("✅ VALIDATION PASSED: Total price is within budget");
    console.log("=== END DEBUG ===");

    // Return total price spent to buy players
    return totalPlayersPrice;
  } catch (error) {
    throw error;
  }
}
