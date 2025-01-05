import { Document } from "mongoose";

export default interface IPrivacyDoc extends Document {
  title: string;
  content: string;
  is_published: boolean;
  is_message: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace PrivacyRequest {
    interface ICreatePrivacyInput {
      title: string;
      content: string;
      is_message?: boolean;
      is_published?: boolean;
    }
    interface IUpdatePrivacyByStatusInput {
      status: boolean;
    }
    interface IUpdatePrivacyInput {
      title?: string;
      content?: string;
    }
    interface IDeleteAllPrivacies {
      delete_key: string;
    }
  }
}
