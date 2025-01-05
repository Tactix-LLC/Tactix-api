import { Document } from "mongoose";

export default interface ISeasonDoc extends Document {
  name: string;
  season_id: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace SeasonRequest {
    interface ICreateSeasonInput {
      name: string;
    }

    interface IUpdateSeasonInput {
      name: string;
      season_id: string;
    }

    interface IUpdateSeasonStatusInput {
      is_active: boolean;
    }
    interface IDeleteAllSeasonInput {
      delete_key: string;
    }
  }
}
