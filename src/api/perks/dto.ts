import { Document } from "mongoose";

// Interface for competition document
export default interface IPerkDoc extends Document {
    perk_name: string;
    number_of_usage: number;
    week_or_year: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

declare global {
  namespace PerkRequest {
    interface ICreatePerkInput {
        perk_name: string;
        number_of_usage: number;
        week_or_year: string;
    }

    interface IUpdatePerkInput {
      perk_name?: string;
      number_of_usage?: number;
      week_or_year?: string;
    }

    interface IUpdatePerkStatusInput {
      status: boolean;
    }

    interface IDeleteAllPerksDeleteLey {
      deleteKey: string;
    }
  }
}
