import { describe, it, expect } from "@jest/globals";
import {
  RegisterDTO,
  LoginDTO,
  UserResponseDTO,
  AuthResponseDTO,
} from "../../../dto/auth.dto.js";

describe("Auth DTOs", () => {
  describe("RegisterDTO", () => {
    it("should create RegisterDTO with correct properties", () => {
      const dto = new RegisterDTO("John Doe", "john@example.com", "password123");

      expect(dto.name).toBe("John Doe");
      expect(dto.email).toBe("john@example.com");
      expect(dto.password).toBe("password123");
    });
  });

  describe("LoginDTO", () => {
    it("should create LoginDTO with correct properties", () => {
      const dto = new LoginDTO("john@example.com", "password123");

      expect(dto.email).toBe("john@example.com");
      expect(dto.password).toBe("password123");
    });
  });

  describe("UserResponseDTO", () => {
    it("should create UserResponseDTO from user object", () => {
      const user = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        isEmailVerified: true,
        lastLogin: new Date("2024-01-01"),
        createdAt: new Date("2023-01-01"),
        password: "hashedpassword", // Should not be included
      };

      const dto = new UserResponseDTO(user);

      expect(dto.id).toBe("user123");
      expect(dto.name).toBe("John Doe");
      expect(dto.email).toBe("john@example.com");
      expect(dto.isEmailVerified).toBe(true);
      expect(dto.lastLogin).toEqual(new Date("2024-01-01"));
      expect(dto.createdAt).toEqual(new Date("2023-01-01"));
      expect(dto.password).toBeUndefined();
    });

    it("should handle user without optional fields", () => {
      const user = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        isEmailVerified: false,
      };

      const dto = new UserResponseDTO(user);

      expect(dto.id).toBe("user123");
      expect(dto.lastLogin).toBeUndefined();
    });
  });

  describe("AuthResponseDTO", () => {
    it("should create AuthResponseDTO with user", () => {
      const user = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        isEmailVerified: true,
        createdAt: new Date("2023-01-01"),
      };

      const dto = new AuthResponseDTO("Login successful", "token123", user);

      expect(dto.message).toBe("Login successful");
      expect(dto.token).toBe("token123");
      expect(dto.user).toBeInstanceOf(UserResponseDTO);
      expect(dto.user.id).toBe("user123");
    });

    it("should create AuthResponseDTO without user", () => {
      const dto = new AuthResponseDTO("Email sent", null, null);

      expect(dto.message).toBe("Email sent");
      expect(dto.token).toBeNull();
      expect(dto.user).toBeUndefined();
    });
  });
});
