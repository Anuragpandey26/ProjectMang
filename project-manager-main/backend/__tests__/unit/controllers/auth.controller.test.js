import { jest } from "@jest/globals";
import { mockRequest, mockResponse, mockNext } from "../../utils/test-helpers.js";

// Mock auth service
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  verifyEmail: jest.fn(),
  resetPasswordRequest: jest.fn(),
  resetPassword: jest.fn(),
};

jest.unstable_mockModule(
  "../../../modules/auth/services/auth.service.js",
  () => ({
    default: mockAuthService,
  })
);

describe("Auth Controller", () => {
  let authController;

  beforeAll(async () => {
    const module = await import(
      "../../../modules/auth/controllers/auth-controller.js"
    );
    authController = module;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should register user successfully", async () => {
      const req = mockRequest({
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        },
      });
      const res = mockResponse();
      const next = mockNext();

      mockAuthService.register.mockResolvedValue({
        message: "Verification email sent",
      });

      await authController.registerUser(req, res, next);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        "john@example.com",
        "John Doe",
        "password123",
        req
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Verification email sent",
      });
    });

    it("should handle errors", async () => {
      const req = mockRequest({
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        },
      });
      const res = mockResponse();
      const next = mockNext();

      const error = new Error("Registration failed");
      mockAuthService.register.mockRejectedValue(error);

      await authController.registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("loginUser", () => {
    it("should login user successfully", async () => {
      const req = mockRequest({
        body: {
          email: "john@example.com",
          password: "password123",
        },
      });
      const res = mockResponse();
      const next = mockNext();

      mockAuthService.login.mockResolvedValue({
        message: "Login successful",
        token: "jwt-token",
        user: { id: "user123", email: "john@example.com" },
      });

      await authController.loginUser(req, res, next);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        "john@example.com",
        "password123"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: "jwt-token",
        })
      );
    });

    it("should handle login errors", async () => {
      const req = mockRequest({
        body: {
          email: "john@example.com",
          password: "wrongpassword",
        },
      });
      const res = mockResponse();
      const next = mockNext();

      const error = new Error("Invalid credentials");
      mockAuthService.login.mockRejectedValue(error);

      await authController.loginUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("verifyEmail", () => {
    it("should verify email successfully", async () => {
      const req = mockRequest({
        body: {
          token: "valid-token",
        },
      });
      const res = mockResponse();
      const next = mockNext();

      mockAuthService.verifyEmail.mockResolvedValue({
        message: "Email verified successfully",
      });

      await authController.verifyEmail(req, res, next);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith("valid-token");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email verified successfully",
      });
    });
  });

  describe("resetPasswordRequest", () => {
    it("should send reset password email successfully", async () => {
      const req = mockRequest({
        body: {
          email: "john@example.com",
        },
      });
      const res = mockResponse();
      const next = mockNext();

      mockAuthService.resetPasswordRequest.mockResolvedValue({
        message: "Reset password email sent",
      });

      await authController.resetPasswordRequest(req, res, next);

      expect(mockAuthService.resetPasswordRequest).toHaveBeenCalledWith(
        "john@example.com"
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("verifyResetPasswordTokenAndResetPassword", () => {
    it("should reset password successfully", async () => {
      const req = mockRequest({
        body: {
          token: "valid-token",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        },
      });
      const res = mockResponse();
      const next = mockNext();

      mockAuthService.resetPassword.mockResolvedValue({
        message: "Password reset successfully",
      });

      await authController.verifyResetPasswordTokenAndResetPassword(
        req,
        res,
        next
      );

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        "valid-token",
        "newpassword123",
        "newpassword123"
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
