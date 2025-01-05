import { Document } from "mongoose";

// Interface for app-update document
export default interface IAppVersionDoc extends Document {
  latest_version: string;
  os: string;
  url: string;
  highly_severe: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Incoming requests input
declare global {
  namespace AppVersionRequest {
    interface ICreateVersionInput {
      latest_version: string;
      os: string;
      url: string;
      highly_severe: boolean;
    }
    interface IUpdateVersion {
      latest_version: string;
      os: string;
      url: string;
    }
    interface IDeleteAllVersions {
      delete_key: string;
    }
    interface IUpdateSeverity {
      highly_severe: boolean;
    }
  }
}
