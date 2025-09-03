import { body } from "express-validator";

const socialLoginValidation = [
  body("provider")
    .notEmpty()
    .withMessage("Provider is required")
    .isIn(["google", "facebook", "apple"])
    .withMessage("Provider must be google, facebook, or apple"),
  
  body("id_token")
    .notEmpty()
    .withMessage("ID token is required"),
  
  body("email")
    .isEmail()
    .withMessage("Valid email is required"),
  
  body("first_name")
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  
  body("last_name")
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  
  body("access_token")
    .optional()
    .isString()
    .withMessage("Access token must be a string"),
  
  body("profile_picture")
    .optional()
    .isURL()
    .withMessage("Profile picture must be a valid URL"),
];

export default socialLoginValidation;
