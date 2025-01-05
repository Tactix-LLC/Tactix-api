import { Document } from "mongoose";

// Structure of poll model
export default interface IPolDoc extends Document {
  question: string;
  choices: IChoices[];
  status: "Open" | "Closed";
  close_date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Structure of "choices" field
export interface IChoices extends Document {
  choice: string;
  selected_by: number;
}

// Structure of data in an incoming request
declare global {
  namespace PollRequests {
    interface ICreateInput {
      question: string;
      choices: IChoices[];
      close_date: Date;
    }
    interface IUpdateInput {
      question: string;
      choices: IChoices[];
      close_date: Date;
    }
    interface IUpdateStatus {
      status: string;
    }
    interface IDeleteAll {
      delete_key: string;
    }
  }
}
