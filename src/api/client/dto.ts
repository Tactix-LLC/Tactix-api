import { Document } from "mongoose";

export default interface IClientDoc extends Document {
  first_name: string;
  last_name: string;
  phone_number?: string;
  email: string;
  birth_date?: Date;
  role: string;
  pin: string;
  pin_confirm: string;
  pin_reset_otp: string | undefined;
  pin_reset_otp_expires: Date;
  pin_reset_otp_count: number;
  is_pin_reset_otp_verified: Boolean;
  pin_changed_at: Date;
  phone_number_changed_at: Date;
  account_status: boolean;
  accept: boolean;
  credit: number;
  pp_public_id: string;
  pp_secure_url: string;
  is_agent: boolean;
  agent_code: string;
  ref_agent_code: string;
  fcm_token?: string;
  commission_balance: number;
  earned_commission: number;
  prize_balance: number;
  earned_prize: number;
  has_team: boolean;
  gameweek_package: number;
  social_provider?: string;
  social_id?: string;
  profile_picture?: string;
  groups?: string[];
  subscription_status?: string;
  subscription_plan?: string | null;
  subscription_expires_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePin: (candidatePin: string, pin: string) => boolean;
  checkPhonenumberChangedAt: (iat: number) => boolean;
  checkPinChangedAt: (iat: number) => boolean;
}

declare global {
  namespace ClientRequest {
    interface ISignup {
      first_name: string;
      last_name: string;
      phone_number?: string;
      email: string;
      birth_date?: Date;
      pin: string;
      pin_confirm: string;
      accept: boolean;
      agent_code?: string;
      ref_agent_code?: string;
      social_provider?: string;
      social_id?: string;
      profile_picture?: string;
    }
    interface ILogin {
      email: string;
      pin: string;
    }
    interface IUpdateProfile {
      first_name: string;
      last_name: string;
      birth_date?: Date;
    }
    interface IUpdatePin {
      current_pin: string;
      pin: string;
      pin_confirm: string;
    }
    interface IForgotPin {
      email: string;
    }
    interface IVerifyResetOtp {
      otp: string;
      email: string;
    }
    interface IResetPin {
      email: string;
      pin: string;
      pin_confirm: string;
    }
    interface IProfilePicture {
      pp_public_id: string;
      pp_secure_url: string;
    }
    interface IUpdateAgentStatus {
      is_agent: boolean;
    }
    interface IUpdatePrize {
      client_id: string;
      earned_prize: number;
      prize_balance: number;
    }
    interface IRefundCredit {
      amount: number;
    }
    interface IRefundPackage {
      gameweeks: number;
    }
    interface IDeleteAllClients {
      delete_key: string;
    }
    interface IBuyPackageCredit {
      amount: number;
      gameweeks: number;
    }
  }
}
