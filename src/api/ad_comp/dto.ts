import { Document } from "mongoose";

// Structure of the ad_client model
export default interface IAdCompanyDoc extends Document {
  comp_name: string;
  comp_name_slug: string;
  comp_tin: string;
  comp_addr: string;
  comp_contact: ICompContact;
  business_type: string;
  website: string;
  createdAt: Date;
  updatedAt: Date;
}

// Structure for the company's contact object
export interface ICompContact {
  phone_number: string[];
  email: string;
}

// Structure of various incoming data
declare global {
  namespace AdCompanyRequests {
    interface ICreateInput {
      comp_name: string;
      comp_name_slug: string;
      comp_tin: string;
      comp_addr: string;
      comp_contact: ICompContact;
      business_type: string;
      website: string;
    }
    interface IUpdateInput {
      comp_name: string;
      comp_name_slug: string;
      comp_tin: string;
      comp_addr: string;
      comp_contact: ICompContact;
      business_type: string;
      website: string;
    }
    interface IDeleteAllCompanies {
      delete_key: string;
    }
  }
}
