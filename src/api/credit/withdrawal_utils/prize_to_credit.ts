import AppError from "../../../utils/app_error";
import Client from "../../client/dal";
import IClientDoc from "../../client/dto";

export default async function movePrizeToCredit(
  loggedInUser: IClientDoc,
  amount: number
) {
  try {
    const user = await Client.getClientById(loggedInUser.id);
    if (!user) throw new AppError("Client not found", 404);

    // Check client has enough prize_balance
    if (user.prize_balance < amount) {
      throw new AppError(
        `You can not withdraw more than ${user.prize_balance}ETB from your available prize balance`,
        400
      );
    }

    // Update prize_balance and credit
    const prize_balance = user.prize_balance - amount;
    const credit = user.credit + amount;
    const updatedClient = await Client.updatePrizeAndCredit({
      id: user.id,
      prize_balance,
      credit,
    });
    return updatedClient;
  } catch (error) {
    throw error;
  }
}
