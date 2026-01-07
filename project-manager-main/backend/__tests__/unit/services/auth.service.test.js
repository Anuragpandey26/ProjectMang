import { jest } from "@jest/globals";
import { AppError } from "../../../error-handlers/global.error-handler.js";

// Mock dependencies
const mockUser = {
  _id: "user123",
  email: "test@example.com",
  name: "Test User",
  password: "$2b$10$hashedpassword",
  isEmailVerified: false,
  save: jest.fn(),
  toObject: jest.fn(() => ({
    _id: "user123",
    email: "test@example.com",
    name: "Test User",
  })),
};

const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const mockVerificationModel = {
  findOne: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
};

const mockBcrypt = {
  genSalt: jest.fn(() => Promise.resolve("salt")),
  hash: jest.fn(() => Promise.resolve("hashedpassword")),
  compare: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(() => "mock-token"),
  verify: jest.fn(),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(() => Promise.resolve(true)),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve(true)),
};

const mockArcjet = {
  protect: jest.fn(() =>
    Promise.resolve({
      isDenied: () => false,
    })
  ),
};

// Mock modules
jest.unstable_mockModule("../../../modules/auth/models/user.js", () => ({
  default: mockUserModel,
}));

jest.unstable_mockModule("../../../modules/auth/models/verification.js", () => ({
  default: mockVerificationModel,
}));

jest.unstable_mockModule("bcrypt", () => mockBcrypt);
jest.unstable_mockModule("jsonwebtoken", () => mockJwt);

jest.unstable_mockModule("../../../adapters/email/services/email.service.js", () => ({
  default: mockEmailService,
}));

jest.unstable_mockModule("../../../adapters/security/arcjet.adapter.js", () => ({
  default: mockArcjet,
}));

describe("AuthService", () => {
  let authService;

  beforeAll(async () => {
    const module = await import("../../../modules/auth/services/auth.service.js");
    authService = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockVerificationModel.create.mockResolvedValue({});

      const result = await authService.register(
        "test@example.com",
        "Test User",
        "password123",
        {}
      );

      expect(result.message).toContain("Verification email sent");
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it("should throw error if email already exists", async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(
        authService.register("test@example.com", "Test User", "password123", {})
      ).rejects.toThrow(AppError);
    });

    it("should throw error if Arcjet denies the request", async () => {
      mockArcjet.protect.mockResolvedValue({
        isDenied: () => true,
      });

      await expect(
        authService.register("test@example.com", "Test User", "password123", {})
      ).rejects.toThrow(AppError);
    });

    it("should throw error if email sending fails", async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockEmailService.sendVerificationEmail.mockResolvedValue(false);

      await expect(
        authService.register("test@example.com", "Test User", "password123", {})
      ).rejects.toThrow(AppError);
    });
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true };
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(verifiedUser),
      });
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await authService.login("test@example.com", "password123");

      expect(result.message).toBe("Login successful");
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it("should throw error for invalid credentials", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.login("test@example.com", "wrongpassword")
      ).rejects.toThrow(AppError);
    });

    it("should throw error if email not verified", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockVerificationModel.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000),
      });

      await expect(
        authService.login("test@example.com", "password123")
      ).rejects.toThrow(AppError);
    });
  });

  describe("verifyEmail", () => {
    it("should verify email successfully", async () => {
      const mockPayload = { userId: "user123", purpose: "email-verification" };
      mockJwt.verify.mockReturnValue(mockPayload);
      mockVerificationModel.findOne.mockResolvedValue({
        _id: "verification123",
        expiresAt: new Date(Date.now() + 10000),
      });
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await authService.verifyEmail("valid-token");

      expect(result.message).toBe("Email verified successfully");
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw error for expired token", async () => {
      const mockPayload = { userId: "user123", purpose: "email-verification" };
      mockJwt.verify.mockReturnValue(mockPayload);
      mockVerificationModel.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() - 10000),
      });

      await expect(authService.verifyEmail("expired-token")).rejects.toThrow(
        AppError
      );
    });

    it("should throw error for invalid token purpose", async () => {
      const mockPayload = { userId: "user123", purpose: "wrong-purpose" };
      mockJwt.verify.mockReturnValue(mockPayload);

      await expect(authService.verifyEmail("invalid-token")).rejects.toThrow(
        AppError
      );
    });
  });

  describe("resetPasswordRequest", () => {
    it("should send reset password email successfully", async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true };
      mockUserModel.findOne.mockResolvedValue(verifiedUser);
      mockVerificationModel.findOne.mockResolvedValue(null);
      mockVerificationModel.create.mockResolvedValue({});

      const result = await authService.resetPasswordRequest("test@example.com");

      expect(result.message).toBe("Reset password email sent");
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it("should throw error if user not found", async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        authService.resetPasswordRequest("notfound@example.com")
      ).rejects.toThrow(AppError);
    });

    it("should throw error if email not verified", async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(
        authService.resetPasswordRequest("test@example.com")
      ).rejects.toThrow(AppError);
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const mockPayload = { userId: "user123", purpose: "reset-password" };
      mockJwt.verify.mockReturnValue(mockPayload);
      mockVerificationModel.findOne.mockResolvedValue({
        _id: "verification123",
        expiresAt: new Date(Date.now() + 10000),
      });
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await authService.resetPassword(
        "valid-token",
        "newpassword123",
        "newpassword123"
      );

      expect(result.message).toBe("Password reset successfully");
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw error if passwords don't match", async () => {
      const mockPayload = { userId: "user123", purpose: "reset-password" };
      mockJwt.verify.mockReturnValue(mockPayload);
      mockVerificationModel.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000),
      });
      mockUserModel.findById.mockResolvedValue(mockUser);

      await expect(
        authService.resetPassword("valid-token", "password1", "password2")
      ).rejects.toThrow(AppError);
    });
  });
});
