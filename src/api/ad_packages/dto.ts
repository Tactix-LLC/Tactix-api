import { Document } from "mongoose";

// Structure of the Adpackages model
export default interface IAdPackagesDoc extends Document {
  pack_name: string;
  pack_name_slug: string;
  price: number;
  duration: number;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

// Structure data in different incoming requests
declare global {
  namespace AdPackagesRequests {
    interface ICreateInput {
      pack_name: string;
      pack_name_slug: string;
      price: number;
      duration: number;
    }
    interface IUpdateInput {
      price: number;
      duration: number;
    }
    interface IUpdateStatusInput {
      status: "Active" | "Inactive";
    }
    interface IDeleteAllPackages {
      delete_key: string;
    }
  }
}
