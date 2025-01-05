import Client from "../../../client/dal";
import IClientDoc from "../../../client/dto";
import IGameWeekDoc from "../../../game_week/dto";
import Purchase from "../../../purchase/dal";
import ITeamDoc from "../../../team/dto";

/**
 * Lets a user purchase from either his credit or package(if he has a package) or for free(if game week is free)
 */
export default async (
  user: IClientDoc,
  gameWeek: IGameWeekDoc,
  clientTeam: ITeamDoc
) => {
  // If game week is not free, let the client join either by package or credit
  if (!gameWeek.is_free) {
    if (user.gameweek_package) {
      await purchaseByPackage(user, gameWeek.game_week, clientTeam.team_name);
    } else {
      await purchaseByCredit(user, clientTeam.team_name, gameWeek.game_week);
    }
  } else {
    await purchaseForFree(user.id, gameWeek.game_week, clientTeam.team_name);
  }
};

// Function to do the purchase game week by package
async function purchaseByPackage(
  user: IClientDoc,
  gameWeek: string,
  teamName: string
) {
  try {
    // Deduct from gameweek packages
    const latestGameweekPackage = user.gameweek_package - 1;
    await Client.updateGameweekPackage({
      id: user.id,
      gameweeks: latestGameweekPackage,
    });

    // Create purchase
    await Purchase.createPurchase({
      client_id: user.id,
      game_week: gameWeek,
      team_name: teamName,
      is_package: true,
    });
  } catch (error) {
    throw error;
  }
}

// Function to purchase game week by deducting from credit
async function purchaseByCredit(
  user: IClientDoc,
  gameWeek: string,
  teamName: string
) {
  try {
    // Deduct from user's client
    const latestCreditAmount = user.credit - 45;
    await Client.updateClientCredit({
      amount: latestCreditAmount,
      id: user.id,
    });

    // Create purchase
    await Purchase.createPurchase({
      client_id: user.id,
      game_week: gameWeek,
      team_name: teamName,
    });
  } catch (error) {
    throw error;
  }
}

// Purchase game week for free
async function purchaseForFree(
  userId: string,
  gameWeek: string,
  teamName: string
) {
  try {
    await Purchase.createPurchase({
      client_id: userId,
      game_week: gameWeek,
      team_name: teamName,
      amount: 0,
    });
  } catch (error) {
    throw error;
  }
}
