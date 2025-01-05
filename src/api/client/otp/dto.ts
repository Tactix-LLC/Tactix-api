export {};

export default interface IOtpDoc {
  first_name: string;
  last_name: string;
  phone_number: string;
  birth_date: string;
  pin: string;
  pin_confirm: string;
  accept: string;
  otp: string;
  otp_count: string;
  agent_code: string;
  ref_agent_code: string;
  created_at: string;
  updated_at: string;
}

declare global {
  namespace OTPRequest {
    interface ISendOtp {
      first_name: string;
      last_name: string;
      phone_number: string;
      birth_date: Date;
      pin: string;
      pin_confirm: string;
      accept: boolean;
      agent_code?: string;
      ref_agent_code: string;
    }
    interface IUpdateOtp {
      otp: string;
      otp_count: number;
      updated_at: Date;
    }
    interface IVerifyOtp {
      phone_number: string;
      otp: string;
    }
  }
}
