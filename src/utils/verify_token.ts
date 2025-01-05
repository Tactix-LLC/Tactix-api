import { JwtPayload, verify } from "jsonwebtoken";
import configs from "../configs";

interface CustomJWTPayload extends JwtPayload {
  id: string;
  user: "client" | "admin";
}

export default (token: string): CustomJWTPayload => {
  return verify(token, configs.jwt.secret) as CustomJWTPayload;
};
