import Router from "express";
const router = Router();

import protect from "../../utils/protect";
import auth from "../../utils/auth";

// Validators
import validator from "../../utils/validator";
import { createNoteValidator, updateNoteValidator } from "./validation";

// Controller methods
import {
  createNote,
  deleteAllNotes,
  deleteNote,
  getClientNotes,
  getOneClientNote,
  updateNote,
} from "./controller";

// Mount routes with controller methods
router
  .route("/")
  .post(protect, auth("Client"), validator(createNoteValidator), createNote)
  .get(protect, auth("Super-admin", "Admin", "Client"), getClientNotes)
  .delete(protect, auth("Super-admin", "Admin", "Client"), deleteAllNotes);

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin", "Client"), getOneClientNote)
  .patch(protect, auth("Client"), validator(updateNoteValidator), updateNote)
  .delete(protect, auth("Super-admin", "Admin", "Client"), deleteNote);

// Export router
export default router;
