import jwt from "jsonwebtoken";
import { AppError } from "./global.error-handler.js";

const handleJWTError = (err) => {
  if (err instanceof jwt.JsonWebTokenError) {
    return new AppError("Invalid token. Please login again", 401);
  }
  if (err instanceof jwt.TokenExpiredError) {
    return new AppError("Token expired. Please login again", 401);
  }
  return err;
};

export { handleJWTError };
