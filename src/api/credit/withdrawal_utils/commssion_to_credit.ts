import AppError from "../../../utils/app_error";
import Client from "../../client/dal";
import IClientDoc from "../../client/dto";

export default async function moveCommissionToCredit(
  loggedInUser: IClientDoc,
  amount: number
) {
  try {
    const user = await Client.getClientById(loggedInUser.id);
    if (!user) throw new AppError("Client not found", 404);

    // Check has enough commission balance
    if (user.commission_balance < amount) {
      throw new AppError(
        `You can not withdraw more than ${user.commission_balance}ETB from your available commission balance`,
        400
      );
    }

    // Update client commission_balance and credit
    const commission_balance = user.commission_balance - amount;
    const credit = user.credit + amount;
    const updatedUser = await Client.updateCommissionAndCredit({
      id: user.id,
      commission_balance,
      credit,
    });

    return updatedUser;
  } catch (error) {
    throw error;
  }
}
