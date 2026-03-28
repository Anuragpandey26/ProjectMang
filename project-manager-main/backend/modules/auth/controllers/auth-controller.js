import authService from "../services/auth.service.js";
import tokenService from "../../../services/token.service.js";

const registerUser = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    const result = await authService.register(email, name, password, req);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    };
    
    const result = await authService.login(email, password, deviceInfo);
    
    // Set refresh token in HttpOnly cookie
    res.cookie("refreshToken", result.refreshToken, tokenService.getCookieOptions());
    
    // Remove refreshToken from response body for security
    const { refreshToken, ...responseBody } = result;
    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await authService.verifyEmail(token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const resetPasswordRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resetPasswordRequest(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyResetPasswordTokenAndResetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword, confirmPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    // Try to get refresh token from signed cookies first, fallback to body
    const token = req.signedCookies.refreshToken || req.body.refreshToken;
    
    if (!token) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    };
    
    const result = await authService.refreshToken(token, deviceInfo);
    
    // Set new refresh token in cookie (Rotation)
    res.cookie("refreshToken", result.refreshToken, tokenService.getCookieOptions());
    
    const { refreshToken, ...responseBody } = result;
    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.signedCookies.refreshToken || req.body.refreshToken;
    const accessToken = req.headers.authorization?.split(" ")[1];
    
    if (token) {
      await authService.logout(token);
    }

    if (accessToken) {
      await tokenService.blacklistAccessToken(accessToken);
    }
    
    // Clear the cookie
    res.clearCookie("refreshToken", tokenService.getCookieOptions());
    
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

const logoutAllDevices = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (accessToken) {
      await tokenService.blacklistAccessToken(accessToken);
    }

    const result = await authService.logoutAllDevices(req.user._id);
    res.clearCookie("refreshToken", tokenService.getCookieOptions());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await authService.getActiveSessions(req.user._id);
    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};

export {
  registerUser,
  loginUser,
  verifyEmail,
  resetPasswordRequest,
  verifyResetPasswordTokenAndResetPassword,
  refreshToken,
  logout,
  logoutAllDevices,
  getActiveSessions,
};
