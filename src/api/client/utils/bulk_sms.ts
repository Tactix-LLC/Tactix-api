import configs from "../../../configs";
import schedule from "node-schedule";
import axios from "axios";

export default async (data: {
  content: string;
  phone_numbers: string[];
  confirmation_phone_number: string;
  start_time: Date;
}) => {
  try {
    // Set up a scheduled job
    const job = schedule.scheduleJob(`${data.start_time}`, () => {
      console.log(data.start_time);
      console.log("Started");
      // Send Confirmation SMS
      // Confirmation content started
      const confirmation_content_start = "Sending SMS for clients has started";
      axios.get(
        `https://api.afromessage.com/api/send?from=${configs.afro.identifier}&sender=${configs.afro.sender_name}&to=${data.confirmation_phone_number}&message=${confirmation_content_start}`,
        {
          headers: {
            Authorization: `Bearer ${configs.afro.api_key}`,
          },
        }
      );

      // Send SMS for clients
      axios.post(
        `https://api.afromessage.com/api/bulk_send`,
        {
          to: data.phone_numbers,
          message: data.content,
          from: configs.afro.identifier,
          sender: configs.afro.sender_name,
        },
        {
          headers: {
            Authorization: `Bearer ${configs.afro.api_key}`,
          },
        }
      );

      // Send Confirmation SMS
      // Confirmation content
      const confirmation_content_done = "Sending SMS for clients is done";
      axios.get(
        `https://api.afromessage.com/api/send?from=${configs.afro.identifier}&sender=${configs.afro.sender_name}&to=${data.confirmation_phone_number}&message=${confirmation_content_done}`,
        {
          headers: {
            Authorization: `Bearer ${configs.afro.api_key}`,
          },
        }
      );
    });
  } catch (error) {
    throw error;
  }
};
