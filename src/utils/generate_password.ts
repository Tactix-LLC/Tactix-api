import { generate } from "generate-password";

export default (): string => {
  return generate({
    uppercase: true,
    lowercase: true,
    symbols: true,
    numbers: true,
  });
};
