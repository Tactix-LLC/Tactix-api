export {};

export interface Bank {
  id: string;
  name: string;
  country_id: string;
  acct_length: number;
  active: 0 | 1;
  currency: "ETB" | "USD";
}

declare global {
  namespace CreditRequest {
    interface ICreditTopup {
      amount: number;
      phone_number: string;
      auto_join: boolean;
      cid: string;
      is_package: boolean;
      gameweeks?: number;
    }
    interface IWithdrawal {
      amount: number;
      bank_code: string;
      account_number: string;
      account_name: string;
      toBankOrCredit: string;
      fromPrizeOrCommission: string;
    }
    interface ITransferCredit {
      amount: number;
      from: string;
      to: string;
    }
    interface IStripePayment {
      amount: number;
      currency: string;
    }
  }
}
