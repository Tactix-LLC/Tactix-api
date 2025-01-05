import { generate } from "otp-generator";
export default (data: { first_name: string; last_name: string }): string => {
  const otp = generate(5, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  return `LO${data.first_name[0].toUpperCase()}${data.last_name[0].toUpperCase()}-${otp}`;
};
