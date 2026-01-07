import { jest } from "@jest/globals";
import { AppError, globalErrorHandler } from "../../../error-handlers/global.error-handler.js";

describe("Error Handlers", () => {
  describe("AppError", () => {
    it("should create an AppError with correct properties", () => {
      const error = new AppError("Test error", 400);

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it("should capture stack trace", () => {
      const error = new AppError("Test error", 500);

      expect(error.stack).toBeDefined();
    });
  });

  describe("globalErrorHandler", () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it("should handle operational errors in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new AppError("Operational error", 400);
      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Operational error",
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should hide non-operational errors in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Internal error");
      error.statusCode = 500;
      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should show full error details in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Development error");
      error.statusCode = 500;
      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Development error",
          error: expect.any(Object),
          stack: expect.any(String),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should use default status code and message if not provided", () => {
      const error = new Error();
      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Something went wrong",
        })
      );
    });
  });
});
