import { Document } from "mongoose";

export default interface ITermsAndConditionsDoc extends Document {
  title: string;
  content: string;
  is_published: boolean;
  is_message: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace TermsRequest {
    interface ICreateTermsInput {
      title: string;
      content: string;
      is_published?: boolean;
      is_message?: boolean;
    }
    interface IUpdateTermsInput {
      title?: string;
      content?: string;
      is_published?: boolean;
    }
    interface IUpdateTermStatusInput {
      status: boolean;
    }
    interface IDeleteAllTermsInput {
      delete_key: string;
    }
  }
}
