import { Document } from "mongoose";

// Interface for the Groups model
export default interface IGroupDoc extends Document {
  name: string;
  name_slug: string;
  description?: string;
  max_members: number;
  owner: string; // ObjectId reference to Client
  code: string; // Unique short code for joining
  members: string[]; // Array of Client ObjectIds
  status: 'active' | 'inactive' | 'archived';
  competition?: string; // ObjectId reference to Competition (for future use)
  is_public: boolean;
  join_code: string; // Alternative join method
  created_at: Date;
  updated_at: Date;
}

// Request interfaces
declare global {
  namespace GroupRequest {
    interface ICreateGroup {
      name: string;
      description?: string;
      max_members?: number;
      is_public?: boolean;
    }

    interface IJoinGroup {
      group_id?: string;
      join_code?: string;
    }

    interface IUpdateGroup {
      name?: string;
      description?: string;
      max_members?: number;
      is_public?: boolean;
      status?: 'active' | 'inactive' | 'archived';
    }

    interface IRemoveMember {
      member_id: string;
    }

    interface ISearchGroups {
      query: string;
      page?: number;
      limit?: number;
    }
  }
}
