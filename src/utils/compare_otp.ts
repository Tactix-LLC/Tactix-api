import bcrypt from "bcryptjs";

export default (candidate_otp: string, hashed_otp: string): boolean => {
  return bcrypt.compareSync(candidate_otp, hashed_otp);
};
