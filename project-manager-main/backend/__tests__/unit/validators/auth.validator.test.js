import { describe, it, expect } from "@jest/globals";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  emailSchema,
} from "../../../modules/auth/validators/auth.validator.js";

describe("Auth Validators", () => {
  describe("registerSchema", () => {
    it("should validate correct registration data", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject short name", () => {
      const invalidData = {
        name: "Jo",
        email: "john@example.com",
        password: "password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Name is required");
    });

    it("should reject invalid email", () => {
      const invalidData = {
        name: "John Doe",
        email: "invalid-email",
        password: "password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Invalid email");
    });

    it("should reject short password", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "short",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("at least 8 characters");
    });

    it("should reject missing fields", () => {
      const invalidData = {
        name: "John Doe",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const validData = {
        email: "john@example.com",
        password: "password123",
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "john@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("verifyEmailSchema", () => {
    it("should validate correct token", () => {
      const validData = {
        token: "valid-token-string",
      };

      const result = verifyEmailSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty token", () => {
      const invalidData = {
        token: "",
      };

      const result = verifyEmailSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should validate correct reset password data", () => {
      const validData = {
        token: "valid-token",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      };

      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject short new password", () => {
      const invalidData = {
        token: "valid-token",
        newPassword: "short",
        confirmPassword: "short",
      };

      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing confirm password", () => {
      const invalidData = {
        token: "valid-token",
        newPassword: "newpassword123",
        confirmPassword: "",
      };

      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("emailSchema", () => {
    it("should validate correct email", () => {
      const validData = {
        email: "test@example.com",
      };

      const result = emailSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "not-valid-email",
      };

      const result = emailSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
