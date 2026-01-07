import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

class SendGridAdapter {
    constructor() {
        if (!process.env.SEND_GRID_API) {
            console.warn("SEND_GRID_API is not set");
        }
        sgMail.setApiKey(process.env.SEND_GRID_API);
        this.fromEmail = process.env.FROM_EMAIL || "noreply@catalyst.app";
    }

    /**
     * Send an email
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} html - HTML content
     * @returns {Promise<boolean>} - True if sent, false otherwise
     */
    async sendEmail(to, subject, html) {
        const msg = {
            to,
            from: `Catalyst <${this.fromEmail}>`,
            subject,
            html,
        };

        try {
            await sgMail.send(msg);
            console.log("Email sent successfully");
            return true;
        } catch (error) {
            console.error("Error sending email:", error);
            return false;
        }
    }
}

export default new SendGridAdapter();
