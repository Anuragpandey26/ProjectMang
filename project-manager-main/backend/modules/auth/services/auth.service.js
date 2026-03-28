import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Verification from "../models/verification.js";
import emailService from "../../../adapters/email/services/email.service.js";
import tokenService from "../../../services/token.service.js";
import { AppError } from "../../../error-handlers/global.error-handler.js";

class AuthService {
  async register(email, name, password, req) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError("Email address already in use", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashPassword,
      name,
    });

    const verificationToken = jwt.sign(
      { userId: newUser._id, purpose: "email-verification" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await Verification.create({
      userId: newUser._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const isEmailSent = await emailService.sendVerificationEmail(
      email,
      verificationLink,
      name
    );

    if (!isEmailSent) {
      throw new AppError("Failed to send verification email", 500);
    }

    return {
      message:
        "Verification email sent to your email. Please check and verify your account.",
    };
  }

  async login(email, password, deviceInfo = {}) {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AppError("Invalid email or password", 400);
    }

    if (!user.isEmailVerified) {
      const existingVerification = await Verification.findOne({
        userId: user._id,
      });

      if (existingVerification && existingVerification.expiresAt > new Date()) {
        throw new AppError(
          "Email not verified. Please check your email for the verification link.",
          400
        );
      } else {
        if (existingVerification) {
          await Verification.findByIdAndDelete(existingVerification._id);
        }

        const verificationToken = jwt.sign(
          { userId: user._id, purpose: "email-verification" },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        await Verification.create({
          userId: user._id,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        });

        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const isEmailSent = await emailService.sendVerificationEmail(
          email,
          verificationLink,
          user.name
        );

        if (!isEmailSent) {
          throw new AppError("Failed to send verification email", 500);
        }

        return {
          message:
            "Verification email sent to your email. Please check and verify your account.",
        };
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 400);
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await tokenService.generateTokenPair(
      user._id.toString(),
      deviceInfo
    );

    user.lastLogin = new Date();
    await user.save();

    const userData = user.toObject();
    delete userData.password;

    return {
      message: "Login successful",
      accessToken,
      refreshToken,
      user: userData,
    };
  }

  async verifyEmail(token) {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload) {
      throw new AppError("Unauthorized", 401);
    }

    const { userId, purpose } = payload;

    if (purpose !== "email-verification") {
      throw new AppError("Unauthorized", 401);
    }

    const verification = await Verification.findOne({
      userId,
      token,
    });

    if (!verification) {
      throw new AppError("Unauthorized", 401);
    }

    const isTokenExpired = verification.expiresAt < new Date();

    if (isTokenExpired) {
      throw new AppError("Token expired", 401);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    if (user.isEmailVerified) {
      throw new AppError("Email already verified", 400);
    }

    user.isEmailVerified = true;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    return { message: "Email verified successfully" };
  }

  async resetPasswordRequest(email) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError("User not found", 400);
    }

    if (!user.isEmailVerified) {
      throw new AppError("Please verify your email first", 400);
    }

    const existingVerification = await Verification.findOne({
      userId: user._id,
    });

    if (existingVerification && existingVerification.expiresAt > new Date()) {
      throw new AppError("Reset password request already sent", 400);
    }

    if (existingVerification && existingVerification.expiresAt < new Date()) {
      await Verification.findByIdAndDelete(existingVerification._id);
    }

    const resetPasswordToken = jwt.sign(
      { userId: user._id, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    await Verification.create({
      userId: user._id,
      token: resetPasswordToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;

    const isEmailSent = await emailService.sendPasswordResetEmail(
      email,
      resetPasswordLink,
      user.name
    );

    if (!isEmailSent) {
      throw new AppError("Failed to send reset password email", 500);
    }

    return { message: "Reset password email sent" };
  }

  async resetPassword(token, newPassword, confirmPassword) {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload) {
      throw new AppError("Unauthorized", 401);
    }

    const { userId, purpose } = payload;

    if (purpose !== "reset-password") {
      throw new AppError("Unauthorized", 401);
    }

    const verification = await Verification.findOne({
      userId,
      token,
    });

    if (!verification) {
      throw new AppError("Unauthorized", 401);
    }

    const isTokenExpired = verification.expiresAt < new Date();

    if (isTokenExpired) {
      throw new AppError("Token expired", 401);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError("Passwords do not match", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashPassword;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    return { message: "Password reset successfully" };
  }

  async refreshToken(refreshToken, deviceInfo = {}) {
    return await tokenService.refreshAccessToken(refreshToken, deviceInfo);
  }

  async logout(refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken);
    return { message: "Logged out successfully" };
  }

  async logoutAllDevices(userId) {
    await tokenService.revokeAllUserTokens(userId);
    return { message: "Logged out from all devices successfully" };
  }

  async getActiveSessions(userId) {
    return await tokenService.getUserActiveSessions(userId);
  }
}

export default new AuthService();
