import AppError from "../../../utils/app_error";

// Calculate difference b/n price of both players
export default function updatedTeamBudget(
  priceDifference: number,
  teamBudget: number
): number {
  // Variable to temprarily store calculated/updated budget
  let updatedBudget: number = 0;

  // Find the new budget
  if (priceDifference > 0) {
    updatedBudget = parseFloat((teamBudget + priceDifference).toFixed(1));
  } else if (priceDifference < 0) {
    updatedBudget = parseFloat((teamBudget + priceDifference).toFixed(1));
    if (updatedBudget < 0) {
      throw new AppError("You don't have enough budget", 400);
    }
  } else if (priceDifference === 0) {
    updatedBudget = teamBudget;
  }
  return updatedBudget;
}
