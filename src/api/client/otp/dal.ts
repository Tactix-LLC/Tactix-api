import { RedisCommandRawReply } from "@redis/client/dist/lib/commands";
import init from "../../../index";
import IOtpDoc from "./dto";

// OTP Service
export default class OTP {
  // Get an otp
  static async getOtp(email: string): Promise<IOtpDoc | null> {
    try {
      const otp = await init.redis_client.hGetAll(`otp_${email}`);
      if (Object.keys(otp).length !== 0) {
        return otp as unknown as IOtpDoc;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Add to Redis
  static async createOtp(
    data: OTPRequest.ISendOtp & {
      otp: string;
      otp_count: number;
      created_at: Date;
      updated_at: Date;
    }
  ): Promise<RedisCommandRawReply> {
    try {
      // const otp = await init.redis_client.hSet(data.phone_number, data as any);
      const otp = await init.redis_client.sendCommand([
        "HSET",
        `otp_${data.phone_number}`,
        "first_name",
        data.first_name,
        "last_name",
        data.last_name,
        "phone_number",
        data.phone_number,
        "birth_date",
        `${data.birth_date}`,
        "pin",
        data.pin,
        "pin_confirm",
        data.pin_confirm,
        "accept",
        `${data.accept}`,
        "agent_code",
        `${data.agent_code}`,
        "ref_agent_code",
        `${data.ref_agent_code}`,
        "otp",
        data.otp,
        "otp_count",
        `${data.otp_count}`,
        "created_at",
        `${data.created_at}`,
        "updated_at",
        `${data.updated_at}`,
      ]);

      return otp;
    } catch (error) {
      throw error;
    }
  }

  // Delete from Redis
  static async deleteOtp(phone_number: string) {
    try {
      await init.redis_client.del(`otp_${phone_number}`);
    } catch (error) {
      throw error;
    }
  }
}
