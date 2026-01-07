import tokenService from "../services/token.service.js";
import User from "../modules/auth/models/user.js";
import { AppError } from "../error-handlers/global.error-handler.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError("No token provided", 401);
    }

    // Verify access token using token service
    const decoded = tokenService.verifyAccessToken(token);
    
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError("User not found", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
