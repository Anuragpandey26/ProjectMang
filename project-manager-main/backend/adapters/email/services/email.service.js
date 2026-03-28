import resendAdapter from "../resend.adapter.js";
import { EmailTemplates } from "../templates/email.templates.js";
import queueService from "../../../services/queue.service.js";

/**
 * EmailService - Sends emails via BullMQ queue or directly.
 *
 * Strategy:
 * - If BullMQ is enabled → queues the email (non-blocking, with retries).
 * - If BullMQ is disabled → sends synchronously via Resend (still works).
 *
 * The `immediate` option always sends synchronously regardless of queue state.
 */
class EmailService {
  /**
   * @private
   * Send email either via queue or directly based on availability.
   */
  async _send(jobName, to, subject, html, options = {}) {
    // Force synchronous send or BullMQ not available → send directly
    if (options.immediate || !queueService.isEnabled()) {
      return await resendAdapter.sendEmail(to, subject, html);
    }

    // Queue the email for async processing
    return await queueService.addJob("email", jobName, { to, subject, html });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(to, verificationLink, userName, options = {}) {
    const subject = "Verify Your Email - Catalyst";
    const html = EmailTemplates.verificationEmail(verificationLink, userName);
    return await this._send("send-verification-email", to, subject, html, options);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to, resetLink, userName, options = {}) {
    const subject = "Reset Your Password - Catalyst";
    const html = EmailTemplates.resetPasswordEmail(resetLink, userName);
    return await this._send("send-password-reset-email", to, subject, html, options);
  }

  /**
   * Send workspace invitation email
   */
  async sendWorkspaceInviteEmail(to, inviteLink, workspaceName, inviterName, role) {
    const subject = `You've been invited to join ${workspaceName} - Catalyst`;
    const html = EmailTemplates.workspaceInviteEmail(
      inviteLink,
      workspaceName,
      inviterName,
      role
    );
    return await this._send("send-invite-email", to, subject, html);
  }

  /**
   * Send task assignment notification email
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
    return await this._send("send-task-assigned-email", to, subject, html);
  }

  /**
   * Send generic email
   */
  async sendCustomEmail(to, subject, html, options = {}) {
    return await this._send("send-email", to, subject, html, options);
  }
}

export default new EmailService();
