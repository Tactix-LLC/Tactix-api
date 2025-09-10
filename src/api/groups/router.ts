import express from "express";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  searchGroups,
  joinGroup,
  leaveGroup,
  removeMember,
  updateGroup,
  deleteGroup,
  getGroupLeaderboard,
  searchUsers,
  addMembersToGroup,
} from "./controller";
import {
  createGroupValidation,
  joinGroupValidation,
  updateGroupValidation,
  removeMemberValidation,
  searchGroupsValidation,
  groupIdValidation,
} from "./validation";
import protect from "../../utils/protect";
import auth from "../../utils/auth";
import handleValidation from "../../utils/handle_validation";

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(auth("Client"));

// Group CRUD operations
router.post("/", createGroupValidation, createGroup);
router.get("/my-groups", getUserGroups);
router.get("/search", searchGroupsValidation, searchGroups);
router.get("/search-users", searchUsers);
router.get("/:id", groupIdValidation, getGroupById);
router.put("/:id", updateGroupValidation, updateGroup);
router.delete("/:id", groupIdValidation, deleteGroup);

// Group membership operations
router.post("/join", joinGroupValidation, joinGroup);
router.post("/:id/leave", groupIdValidation, leaveGroup);
router.post("/:id/remove-member", removeMemberValidation, handleValidation, removeMember);
router.post("/:id/members", groupIdValidation, addMembersToGroup);

// Group leaderboard
router.get("/:id/leaderboard", groupIdValidation, getGroupLeaderboard);

export default router;
