import { describe, it, expect } from "@jest/globals";
import {
  taskSchema,
  timeLogSchema,
} from "../../../modules/task/validators/task.validator.js";

describe("Task Validators", () => {
  describe("taskSchema", () => {
    it("should validate correct task data", () => {
      const validData = {
        title: "Complete feature",
        description: "Build the new dashboard",
        status: "To Do",
        priority: "High",
        dueDate: "2024-12-31",
        assignees: ["user123", "user456"],
      };

      const result = taskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalidData = {
        title: "",
        status: "To Do",
        priority: "High",
        dueDate: "2024-12-31",
        assignees: ["user123"],
      };

      const result = taskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Task title is required");
    });

    it("should reject invalid status", () => {
      const invalidData = {
        title: "Task",
        status: "Invalid Status",
        priority: "High",
        dueDate: "2024-12-31",
        assignees: ["user123"],
      };

      const result = taskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid priority", () => {
      const invalidData = {
        title: "Task",
        status: "To Do",
        priority: "Invalid Priority",
        dueDate: "2024-12-31",
        assignees: ["user123"],
      };

      const result = taskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty assignees array", () => {
      const invalidData = {
        title: "Task",
        status: "To Do",
        priority: "High",
        dueDate: "2024-12-31",
        assignees: [],
      };

      const result = taskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("At least one assignee");
    });

    it("should accept optional description", () => {
      const validData = {
        title: "Task",
        status: "To Do",
        priority: "High",
        dueDate: "2024-12-31",
        assignees: ["user123"],
      };

      const result = taskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate all status options", () => {
      const statuses = ["To Do", "In Progress", "Done"];

      statuses.forEach((status) => {
        const data = {
          title: "Task",
          status,
          priority: "High",
          dueDate: "2024-12-31",
          assignees: ["user123"],
        };

        const result = taskSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should validate all priority options", () => {
      const priorities = ["Low", "Medium", "High"];

      priorities.forEach((priority) => {
        const data = {
          title: "Task",
          status: "To Do",
          priority,
          dueDate: "2024-12-31",
          assignees: ["user123"],
        };

        const result = taskSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("timeLogSchema", () => {
    it("should validate correct time log data", () => {
      const validData = {
        hours: 5.5,
        description: "Worked on feature implementation",
      };

      const result = timeLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept time log without description", () => {
      const validData = {
        hours: 3,
      };

      const result = timeLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject negative hours", () => {
      const invalidData = {
        hours: -2,
        description: "Invalid time",
      };

      const result = timeLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("non-negative");
    });

    it("should accept zero hours", () => {
      const validData = {
        hours: 0,
      };

      const result = timeLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept decimal hours", () => {
      const validData = {
        hours: 2.75,
      };

      const result = timeLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
