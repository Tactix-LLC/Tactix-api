import { Document } from "mongoose";

// Interface for competition document
export default interface ICoachDoc extends Document {
  coach_name: string;
  coach_slugify_name: string;
  image_public_id: string;
  image_secure_url: string;
  is_active: boolean;
  is_major: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace CoachRequest {
    interface ICreateCoachInput {
      coach_name: string;
      image_public_id: string;
      image_secure_url: string;
    }

    interface IUpdateCoachInfoInput {
      coach_name: string;
    }

    interface IUpdateCoachImageInput {
      image_public_id: string;
      image_secure_url: string;
    }

    interface IUpdateStatusOfCoachInput {
      is_active: boolean;
    }

    interface ISwapMajorCoachInput {
      existingCoachId: string;
      newMajorCoachId: string;
    }

    interface IDeleteAllCoachesInput {
      deleteKey: string;
    }
  }
}
