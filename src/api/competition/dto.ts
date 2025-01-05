import { Document } from "mongoose";

// Interface for competition document
export default interface ICompetitionDoc extends Document {
  competition_name: string;
  sid: string;
  cid: string;
  logo: string;
  is_active: boolean;
  season: string;
  competition_slug: string;
  start_date: Date;
  end_date: Date;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace CompetitionRequest {
    interface ICreateCompetitionInput {
      cid: string;
      season: string;
    }
    interface IUpdateCompetitionInput {
      cid: string;
    }
    interface IUpdateCompetitionStatusInput {
      is_active: boolean;
    }
    interface IDeleteAllCompetitionsInput {
      delete_key: string;
    }
  }
}
