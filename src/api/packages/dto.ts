import { Document } from "mongoose";

export default interface IPackagesDoc extends Document {
  price: number;
  game_weeks: number;
  total_amount: number;
  discount: number;
  discounted_total_amount: number;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace PackagesRequest {
    interface ICreatePackage {
      price: number;
      game_weeks: number;
      discount: number;
    }
    interface IUpdatePackageStatus {
      is_active: boolean;
    }
    interface IDeleteAllPackages {
      delete_key: string;
    }
  }
}
