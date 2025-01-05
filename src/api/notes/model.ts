import mongoose, { Schema } from "mongoose";
import INotesDoc from "./dto";

// Note schema
const noteSchema = new Schema(
  {
    client_id: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: [true, "Client id is required"],
    },
    note: {
      type: String,
      require: [true, "Please add note"],
      minlength: [2, "Note should contain atleat 2 characters"],
      maxlength: [250, "Note can not contain more than 250 characters"],
    },
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
    },
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Model
const Note = mongoose.model<INotesDoc>("Notes", noteSchema);

// Export the model
export default Note;
