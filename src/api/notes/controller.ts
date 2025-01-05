import { RequestHandler } from "express";
import AppError from "../../utils/app_error";
import Notes from "./dal";
import INotesDoc from "./dto";
import IClientDoc from "../client/dto";

// Create note
export const createNote: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <NotesRequest.ICreateNoteInput>req.value;
    const user = <IClientDoc>req.user;
    data.client_id = user.id;

    // Create note
    const note = await Notes.createNote(data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Note created successfully",
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

// Get all notes of a client
export const getClientNotes: RequestHandler = async (req, res, next) => {
  try {
    // Id of the logged in client
    const clientId = <IClientDoc>req.user;
    // Get all notes of the logged in client
    const clientNotes = await Notes.getClientNotes(clientId.id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: clientNotes.length,
      data: { clientNotes },
    });
  } catch (error) {
    next(error);
  }
};

// Get single note of a client
export const getOneClientNote: RequestHandler = async (req, res, next) => {
  try {
    // Get note
    const note = await Notes.getClientNote(req.params.id);
    if (!note) return next(new AppError("Note not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

// Update note - for clients
export const updateNote: RequestHandler = async (req, res, next) => {
  try {
    const { note } = <NotesRequest.IUpdateNoteInput>req.value;

    // Update note
    const updatedNote = await Notes.updateNote({ note, id: req.params.id });
    if (!updatedNote) return next(new AppError("Note not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Note updated successfully",
      data: { note: updatedNote },
    });
  } catch (error) {
    next(error);
  }
};

// Delete
export const deleteNote: RequestHandler = async (req, res, next) => {
  try {
    // Delete note
    const note = await Notes.deleteNote(req.params.id);
    if (!note) return next(new AppError("Note not found", 404));

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all notes
export const deleteAllNotes: RequestHandler = async (req, res, next) => {
  try {
    // Data of the logged in user
    const user = <IClientDoc>req.user;
    await Notes.deleteAllNotes(user.id); // Delete client

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "All notes have been deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
