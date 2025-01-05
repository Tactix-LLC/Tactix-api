import { Document } from "mongoose";

// Structure for the notes model
export default interface INotesDoc extends Document {
  client_id: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace NotesRequest {
    interface ICreateNoteInput {
      client_id: string;
      note: string;
    }
    interface IUpdateNoteInput {
      note: string;
    }
  }
}
