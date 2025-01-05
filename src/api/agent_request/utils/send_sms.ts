import { Response } from "express";
import configs from "../../../configs";
import axios from "axios";

// Send SMS
export default async (
  data: {
    message: string;
    phone_number: string;
  }
) => {
  try {
    await axios.get(
      `https://api.afromessage.com/api/send?from=${configs.afro.identifier}&sender=${configs.afro.sender_name}&to=${data.phone_number}&message=${data.message}`,
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
