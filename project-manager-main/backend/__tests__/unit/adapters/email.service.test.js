import { jest } from "@jest/globals";

// Mock sendGridAdapter
const mockSendGridAdapter = {
  sendEmail: jest.fn(() => Promise.resolve(true)),
};

jest.unstable_mockModule(
  "../../../adapters/email/sendgrid.adapter.js",
  () => ({
    default: mockSendGridAdapter,
  })
);

describe("EmailService", () => {
  let emailService;

  beforeAll(async () => {
    const module = await import(
      "../../../adapters/email/services/email.service.js"
    );
    emailService = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendVerificationEmail", () => {
    it("should send verification email successfully", async () => {
      const result = await emailService.sendVerificationEmail(
        "test@example.com",
        "http://example.com/verify?token=123",
        "John Doe"
      );

      expect(result).toBe(true);
      expect(mockSendGridAdapter.sendEmail).toHaveBeenCalledWith(
        "test@example.com",
        "Verify Your Email - TaskHub",
        expect.stringContaining("John Doe")
      );
    });

    it("should include verification link in email", async () => {
      await emailService.sendVerificationEmail(
        "test@example.com",
        "http://example.com/verify?token=123",
        "John Doe"
      );

      const emailHtml = mockSendGridAdapter.sendEmail.mock.calls[0][2];
      expect(emailHtml).toContain("http://example.com/verify?token=123");
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send password reset email successfully", async () => {
      const result = await emailService.sendPasswordResetEmail(
        "test@example.com",
        "http://example.com/reset?token=456",
        "Jane Doe"
      );

      expect(result).toBe(true);
      expect(mockSendGridAdapter.sendEmail).toHaveBeenCalledWith(
        "test@example.com",
        "Reset Your Password - TaskHub",
        expect.stringContaining("Jane Doe")
      );
    });

    it("should include reset link in email", async () => {
      await emailService.sendPasswordResetEmail(
        "test@example.com",
        "http://example.com/reset?token=456",
        "Jane Doe"
      );

      const emailHtml = mockSendGridAdapter.sendEmail.mock.calls[0][2];
      expect(emailHtml).toContain("http://example.com/reset?token=456");
    });
  });

  describe("sendWorkspaceInviteEmail", () => {
    it("should send workspace invite email successfully", async () => {
      const result = await emailService.sendWorkspaceInviteEmail(
        "newuser@example.com",
        "http://example.com/invite?token=789",
        "My Workspace",
        "John Doe",
        "admin"
      );

      expect(result).toBe(true);
      expect(mockSendGridAdapter.sendEmail).toHaveBeenCalledWith(
        "newuser@example.com",
        "You've been invited to join My Workspace - TaskHub",
        expect.stringContaining("My Workspace")
      );
    });

    it("should include workspace details in email", async () => {
      await emailService.sendWorkspaceInviteEmail(
        "newuser@example.com",
        "http://example.com/invite?token=789",
        "My Workspace",
        "John Doe",
        "admin"
      );

      const emailHtml = mockSendGridAdapter.sendEmail.mock.calls[0][2];
      expect(emailHtml).toContain("My Workspace");
      expect(emailHtml).toContain("John Doe");
      expect(emailHtml).toContain("admin");
    });
  });

  describe("sendTaskAssignedEmail", () => {
    it("should send task assigned email successfully", async () => {
      const result = await emailService.sendTaskAssignedEmail(
        "assignee@example.com",
        "Complete the feature",
        "Build the new dashboard",
        "Manager Name",
        "Project Alpha",
        "http://example.com/task/123"
      );

      expect(result).toBe(true);
      expect(mockSendGridAdapter.sendEmail).toHaveBeenCalledWith(
        "assignee@example.com",
        "New Task Assigned: Complete the feature - TaskHub",
        expect.stringContaining("Complete the feature")
      );
    });

    it("should include task details in email", async () => {
      await emailService.sendTaskAssignedEmail(
        "assignee@example.com",
        "Complete the feature",
        "Build the new dashboard",
        "Manager Name",
        "Project Alpha",
        "http://example.com/task/123"
      );

      const emailHtml = mockSendGridAdapter.sendEmail.mock.calls[0][2];
      expect(emailHtml).toContain("Complete the feature");
      expect(emailHtml).toContain("Build the new dashboard");
      expect(emailHtml).toContain("Manager Name");
      expect(emailHtml).toContain("Project Alpha");
    });
  });

  describe("sendCustomEmail", () => {
    it("should send custom email successfully", async () => {
      const result = await emailService.sendCustomEmail(
        "custom@example.com",
        "Custom Subject",
        "<p>Custom HTML content</p>"
      );

      expect(result).toBe(true);
      expect(mockSendGridAdapter.sendEmail).toHaveBeenCalledWith(
        "custom@example.com",
        "Custom Subject",
        "<p>Custom HTML content</p>"
      );
    });
  });

  describe("error handling", () => {
    it("should handle email sending failures", async () => {
      mockSendGridAdapter.sendEmail.mockResolvedValueOnce(false);

      const result = await emailService.sendVerificationEmail(
        "test@example.com",
        "http://example.com/verify",
        "Test User"
      );

      expect(result).toBe(false);
    });
  });
});
