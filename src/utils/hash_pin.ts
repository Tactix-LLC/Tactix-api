import bcrypt from "bcryptjs";

export default (pin: string) => {
  const hashedPin = bcrypt.hashSync(pin, 12);
  return { pin: hashedPin, pin_confirm: hashedPin };
};
