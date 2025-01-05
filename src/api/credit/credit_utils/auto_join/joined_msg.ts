import axios from "axios";
import configs from "../../../../configs";
import agent_commission from "../agent_commission";
import IClientDoc from "../../../client/dto";

export default async (user: IClientDoc, gameWeek: string) => {
  try {
    // Send message
    const message = `ውድ የሎጬ ቤተሰብ ${gameWeek}ኛውን ሳምንት ስለተቀላቀሉ እናመሰግናለን፡፡ መልካም እድል፡፡`;
    await axios.get(
      `https://api.afromessage.com/api/send?from=${configs.afro.identifier}&sender=${configs.afro.sender_name}&to=${user.phone_number}&message=${message}`,
      {
        headers: {
          Authorization: `Bearer ${configs.afro.api_key}`,
        },
      }
    );
  } catch (error) {
    throw error;
  }
};
