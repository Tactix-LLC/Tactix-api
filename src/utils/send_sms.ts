import { Response } from "express";
import configs from "../configs";
import axios from "axios";

// Send SMS
export default async (
  res: Response,
  data: {
    message: string;
    phone_number: string;
    response_message: string;
  }
) => {
  axios
    .get(
      `https://api.afromessage.com/api/send?from=${configs.afro.identifier}&sender=${configs.afro.sender_name}&to=${data.phone_number}&message=${data.message}`,
      {
        headers: {
          Authorization: `Bearer ${configs.afro.api_key}`,
        },
      }
    )
    .then(() => {
      res.status(200).json({
        status: "SUCCESS",
        message: data.response_message,
      });
    })
    .catch((err) => {
      res.status(400).json({
        status: "FAIL",
        message: "Unable to send SMS. Please try again later",
      });
    });
};
