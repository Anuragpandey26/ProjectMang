import sendGridAdapter from "../sendgrid.adapter.js";
import { EmailTemplates } from "../templates/email.templates.js";

class EmailService {
  /**
   * Send verification email
   * @param {string} to - Recipient email
   * @param {string} verificationLink - Verification link
   * @param {string} userName - User's name
   * @returns {Promise<boolean>}
   */
  async sendVerificationEmail(to, verificationLink, userName) {
    const subject = "Verify Your Email - Catalyst";
    const html = EmailTemplates.verificationEmail(verificationLink, userName);
    return await sendGridAdapter.sendEmail(to, subject, html);
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email
   * @param {string} resetLink - Password reset link
   * @param {string} userName - User's name
   * @returns {Promise<boolean>}
   */
  async sendPasswordResetEmail(to, resetLink, userName) {
    const subject = "Reset Your Password - Catalyst";
    const html = EmailTemplates.resetPasswordEmail(resetLink, userName);
    return await sendGridAdapter.sendEmail(to, subject, html);
  }

  /**
   * Send workspace invitation email
   * @param {string} to - Recipient email
   * @param {string} inviteLink - Invitation link
   * @param {string} workspaceName - Workspace name
   * @param {string} inviterName - Name of person who sent invite
   * @param {string} role - Role in workspace
   * @returns {Promise<boolean>}
   */
  async sendWorkspaceInviteEmail(to, inviteLink, workspaceName, inviterName, role) {
    const subject = `You've been invited to join ${workspaceName} - Catalyst`;
    const html = EmailTemplates.workspaceInviteEmail(
      inviteLink,
      workspaceName,
      inviterName,
      role
    );
    return await sendGridAdapter.sendEmail(to, subject, html);
  }

  /**
   * Send task assignment notification email
   * @param {string} to - Recipient email
   * @param {string} taskTitle - Task title
   * @param {string} taskDescription - Task description
   * @param {string} assignedBy - Name of person who assigned
   * @param {string} projectName - Project name
   * @param {string} taskLink - Link to task
   * @returns {Promise<boolean>}
   */
  async sendTaskAssignedEmail(to, taskTitle, taskDescription, assignedBy, projectName, taskLink) {
    const subject = `New Task Assigned: ${taskTitle} - Catalyst`;
    const html = EmailTemplates.taskAssignedEmail(
      taskTitle,
      taskDescription,
      assignedBy,
      projectName,
      taskLink
    );
    return await sendGridAdapter.sendEmail(to, subject, html);
  }

  /**
   * Send generic email (for custom use cases)
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @returns {Promise<boolean>}
   */
  async sendCustomEmail(to, subject, html) {
    return await sendGridAdapter.sendEmail(to, subject, html);
  }
}

export default new EmailService();
