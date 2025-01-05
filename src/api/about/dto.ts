import { Document } from "mongoose";

export default interface IAboutUsDoc extends Document {
  content: string;
  is_active: boolean;
  version_title: string;
  version_content: string;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace AboutUsRequest {
    interface IAboutUsInput {
      content: string;
      version_title: string;
      version_content: string;
    }

    interface IUpdateAboutUsInput {
      content: string;
      version_title: string;
      version_content: string;
    }
    interface IUpdateAboutUsStatusInput {
      is_active: boolean;
    }
  }
}
