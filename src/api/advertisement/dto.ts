import { Document } from "mongoose";

export default interface IAdsDoc extends Document {
  ad_company: string;
  ad_package: string;
  start_date: Date;
  end_date: Date;
  link: string;
  is_active: boolean;
  img: {
    cloudinary_secure_url: string;
    cloudinary_public_id: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace AdvertisementRequest {
    interface ICreateAdvertisementInput {
      ad_company: string;
      ad_package: string;
      start_date: Date;
      end_date: Date;
      link: string;
      is_active: boolean;
      img: {
        cloudinary_secure_url: string;
        cloudinary_public_id: string;
      };
    }

    interface IUpdateAdInput {
      ad_company: string;
      ad_package: string;
      link: string;
    }

    interface IUpdateExpiryStatus {
      is_active: boolean;
    }

    interface IUpdateImage {
      img: {
        cloudinary_secure_url: string;
        cloudinary_public_id: string;
      };
    }

    interface IUpdateAdCalendar {
      start_date: Date;
      end_date: Date;
    }
    interface IDeleteAllAds {
      delete_key: string;
    }
  }
}
