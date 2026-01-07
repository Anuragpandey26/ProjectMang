import authService from "../services/auth.service.js";

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
    
    // Extract device info
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    };
    
    const result = await authService.login(email, password, deviceInfo);
    res.status(200).json(result);
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
    const { refreshToken } = req.body;
    
    // Extract device info
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    };
    
    const result = await authService.refreshToken(refreshToken, deviceInfo);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const logoutAllDevices = async (req, res, next) => {
  try {
    const result = await authService.logoutAllDevices(req.user._id);
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
