import { Document } from "mongoose";

export default interface IFaqDoc extends Document {
  title: string;
  content: string;
  is_published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace FaqRequest {
    interface ICreateFaqInput {
      title: string;
      content: string;
    }

    interface IUpdateFaqByStatusInput {
      status: boolean;
    }

    interface IUpdateFaqInput {
      title?: string;
      content?: string;
    }
    interface IDeleteAllFaqsInput {
      delete_key: string;
    }
  }
}
