import { generate } from "otp-generator";
import bcrypt from "bcryptjs";

export default () => {
  const otp = generate(5, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  const hashedOtp = bcrypt.hashSync(otp, 12);
  return { otp, hashedOtp };
};
