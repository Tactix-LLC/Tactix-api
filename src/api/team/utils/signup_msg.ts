import axios from "axios";
import configs from "../../../configs";
import IClientDoc from "../../client/dto";

/**
 * Send message for succssfull signup
 */
export default async function (client: IClientDoc) {
  try {
    const message = `ውድ ${client.first_name} የሎጬን ቤተሰብ ሰለተቀላቀሉ የአንድ ሳምንት መጫወቻ 45ብር ስጦታ አግኝተዋል፡፡ መልካም እድል!`;
    await axios.get(
      `https://api.afromessage.com/api/send?from=${configs.afro.identifier}&sender=${configs.afro.sender_name}&to=${client.phone_number}&message=${message}`,
      {
        headers: {
          Authorization: `Bearer ${configs.afro.api_key}`,
        },
      }
    );
  } catch (error) {
    throw error;
  }
}
