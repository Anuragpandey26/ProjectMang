import { jest } from "@jest/globals";

// Mock ActivityLog model
const mockActivityLog = {
  create: jest.fn(),
  find: jest.fn(() => ({
    sort: jest.fn(() => ({
      limit: jest.fn(() => ({
        populate: jest.fn(() => Promise.resolve([])),
      })),
    })),
  })),
};

jest.unstable_mockModule("../../../modules/task/models/activity.js", () => ({
  default: mockActivityLog,
}));

describe("ActivityLogService", () => {
  let activityLogService;

  beforeAll(async () => {
    const module = await import("../../../services/activity-log.service.js");
    activityLogService = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("recordActivity", () => {
    it("should record activity successfully", async () => {
      mockActivityLog.create.mockResolvedValue({
        user: "user123",
        action: "created_task",
        resourceType: "Task",
        resourceId: "task123",
      });

      await activityLogService.recordActivity(
        "user123",
        "created_task",
        "Task",
        "task123",
        { description: "Created new task" }
      );

      expect(mockActivityLog.create).toHaveBeenCalledWith({
        user: "user123",
        action: "created_task",
        resourceType: "Task",
        resourceId: "task123",
        details: { description: "Created new task" },
      });
    });

    it("should handle errors gracefully", async () => {
      mockActivityLog.create.mockRejectedValue(new Error("Database error"));

      await expect(
        activityLogService.recordActivity(
          "user123",
          "created_task",
          "Task",
          "task123",
          {}
        )
      ).resolves.not.toThrow();
    });
  });

  describe("getUserActivities", () => {
    it("should get user activities successfully", async () => {
      const mockActivities = [
        { action: "created_task", createdAt: new Date() },
        { action: "updated_task", createdAt: new Date() },
      ];

      mockActivityLog.find.mockReturnValue({
        sort: jest.fn(() => ({
          limit: jest.fn(() => ({
            populate: jest.fn(() => Promise.resolve(mockActivities)),
          })),
        })),
      });

      const result = await activityLogService.getUserActivities("user123", 10);

      expect(mockActivityLog.find).toHaveBeenCalledWith({ user: "user123" });
      expect(result).toEqual(mockActivities);
    });

    it("should return empty array on error", async () => {
      mockActivityLog.find.mockImplementation(() => {
        throw new Error("Database error");
      });

      const result = await activityLogService.getUserActivities("user123");

      expect(result).toEqual([]);
    });
  });

  describe("getResourceActivities", () => {
    it("should get resource activities successfully", async () => {
      const mockActivities = [
        { action: "created_task", createdAt: new Date() },
      ];

      mockActivityLog.find.mockReturnValue({
        sort: jest.fn(() => ({
          limit: jest.fn(() => ({
            populate: jest.fn(() => Promise.resolve(mockActivities)),
          })),
        })),
      });

      const result = await activityLogService.getResourceActivities(
        "Task",
        "task123",
        20
      );

      expect(mockActivityLog.find).toHaveBeenCalledWith({
        resourceType: "Task",
        resourceId: "task123",
      });
      expect(result).toEqual(mockActivities);
    });
  });
});
