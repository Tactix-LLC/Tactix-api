import { generate } from "otp-generator";

export default (first_name: string, last_name: string): string => {
  const otp = generate(5, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: true,
    specialChars: false,
  });
  return `${first_name[0]}${last_name[0]}-${otp}`;
};
