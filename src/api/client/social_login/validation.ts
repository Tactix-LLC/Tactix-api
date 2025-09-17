import { body } from "express-validator";

const socialLoginValidation = [
  body("provider")
    .notEmpty()
    .withMessage("Provider is required")
    .isIn(["google", "facebook", "apple"])
    .withMessage("Provider must be google, facebook, or apple"),
  
  body("id_token")
    .optional()
    .isString()
    .withMessage("ID token must be a string"),
  
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
  
  // Custom validation to ensure required tokens are provided based on provider
  body().custom((value) => {
    const { provider, id_token, access_token } = value;
    
    if (provider === 'google' || provider === 'apple') {
      if (!id_token) {
        throw new Error('ID token is required for Google and Apple sign-in');
      }
    }
    
    if (provider === 'facebook') {
      if (!access_token) {
        throw new Error('Access token is required for Facebook sign-in');
      }
    }
    
    return true;
  }),
  
  body("profile_picture")
    .optional()
    .isURL()
    .withMessage("Profile picture must be a valid URL"),
];

export default socialLoginValidation;
