import INotesDoc from "./dto";
import NoteModel from "./model";

/**
 * Data access layer class for notes
 */
class NotesDAL {
  // Create note
  static async createNote(
    data: NotesRequest.ICreateNoteInput
  ): Promise<INotesDoc> {
    try {
      const note = await NoteModel.create(data);
      return note;
    } catch (error) {
      throw error;
    }
  }

  // Get all notes for the logged in user
  static async getClientNotes(clientId: string): Promise<INotesDoc[]> {
    try {
      const clientNotes = await NoteModel.find({ client_id: clientId });
      return clientNotes;
    } catch (error) {
      throw error;
    }
  }

  // Get single note of a client
  static async getClientNote(id: string): Promise<INotesDoc | null> {
    try {
      const note = await NoteModel.findById(id);
      if (note) {
        return note;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update note
  static async updateNote(
    data: NotesRequest.IUpdateNoteInput & { id: string }
  ): Promise<INotesDoc | null> {
    try {
      const note = await NoteModel.findByIdAndUpdate(
        data.id,
        { note: data.note },
        { runValidators: true, new: true }
      );
      if (note) {
        return note;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Delete note
  static async deleteNote(id: string): Promise<INotesDoc | null> {
    try {
      const note = await NoteModel.findByIdAndDelete(id);
      if (note) {
        return note;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Delete all notes
  static async deleteAllNotes(clientId: string) {
    try {
      await NoteModel.deleteMany({ client_id: clientId });
    } catch (error) {
      throw error;
    }
  }
}

// Export the DAL class
export default NotesDAL;
