import { body, param, query } from "express-validator";

// Create group validation
const createGroupValidation = [
  body("name")
    .notEmpty()
    .withMessage("Group name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Group name must be between 2 and 50 characters")
    .trim(),
  body("description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Description cannot exceed 200 characters")
    .trim(),
  body("max_members")
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage("Maximum members must be between 2 and 100"),
  body("is_public")
    .optional()
    .isBoolean()
    .withMessage("is_public must be a boolean"),
];

// Join group validation
const joinGroupValidation = [
  body("group_id")
    .optional()
    .isMongoId()
    .withMessage("Group ID must be a valid MongoDB ObjectId"),
  body("join_code")
    .optional()
    .isLength({ min: 6, max: 8 })
    .withMessage("Join code must be between 6 and 8 characters")
    .isAlphanumeric()
    .withMessage("Join code must contain only alphanumeric characters"),
];

// Update group validation
const updateGroupValidation = [
  param("id")
    .isMongoId()
    .withMessage("Group ID must be a valid MongoDB ObjectId"),
  body("name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Group name must be between 2 and 50 characters")
    .trim(),
  body("description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Description cannot exceed 200 characters")
    .trim(),
  body("max_members")
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage("Maximum members must be between 2 and 100"),
  body("is_public")
    .optional()
    .isBoolean()
    .withMessage("is_public must be a boolean"),
  body("status")
    .optional()
    .isIn(["active", "inactive", "archived"])
    .withMessage("Status must be active, inactive, or archived"),
];

// Remove member validation
const removeMemberValidation = [
  param("id")
    .isMongoId()
    .withMessage("Group ID must be a valid MongoDB ObjectId"),
  body("member_id")
    .isMongoId()
    .withMessage("Member ID must be a valid MongoDB ObjectId"),
];

// Search groups validation
const searchGroupsValidation = [
  query("q")
    .notEmpty()
    .withMessage("Search query is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Search query must be between 1 and 50 characters")
    .trim(),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

// Group ID validation
const groupIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Group ID must be a valid MongoDB ObjectId"),
];

export {
  createGroupValidation,
  joinGroupValidation,
  updateGroupValidation,
  removeMemberValidation,
  searchGroupsValidation,
  groupIdValidation,
};
