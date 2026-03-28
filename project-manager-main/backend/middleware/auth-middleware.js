import tokenService from "../services/token.service.js";
import User from "../modules/auth/models/user.js";
import { AppError } from "../error-handlers/global.error-handler.js";

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.signedCookies && req.signedCookies.accessToken) {
      // Fallback or alternative: Read from signed cookies if implemented for access tokens
      token = req.signedCookies.accessToken;
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError("Authentication required. No token provided.", 401);
    }

    // Check if token is blacklisted (e.g., user logged out)
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AppError("Session expired or logged out. Please login again.", 401);
    }

    // Verify access token using token service
    const decoded = tokenService.verifyAccessToken(token);
    
    // Support both 'sub' (new) and 'userId' (legacy)
    const userId = decoded.sub || decoded.userId;
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found or session invalid", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
