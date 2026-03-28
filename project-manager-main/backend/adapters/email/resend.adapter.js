import { Resend } from "resend";
import dotenv from "dotenv";
import logger from "../../services/logger.service.js";

dotenv.config();

class ResendAdapter {
    constructor() {
        if (!process.env.RESEND_API_KEY) {
            logger.warn("RESEND_API_KEY is not set");
        }
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.fromEmail = process.env.FROM_EMAIL || "Catalyst <onboarding@resend.dev>";
    }

    /**
     * Send an email
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} html - HTML content
     * @returns {Promise<boolean>} - True if sent, false otherwise
     */
    async sendEmail(to, subject, html) {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: [to],
                subject,
                html,
            });

            if (error) {
                logger.error("Error sending email via Resend:", { error });
                
                if (process.env.NODE_ENV === "development") {
                    logger.info("--- [DEVELOPMENT MODE] Email Output ---");
                    logger.info(`To: ${to}`);
                    logger.info(`Subject: ${subject}`);
                    logger.info(`Content: ${html}`);
                    logger.info("---------------------------------------");
                    return true; // Return true in dev to prevent blocking the flow
                }
                return false;
            }

            logger.info(`Email sent successfully via Resend: ${data.id}`);
            return true;
        } catch (error) {
            logger.error(`Unexpected error sending email via Resend: ${error.message}`, { error });
            
            if (process.env.NODE_ENV === "development") {
                logger.info("--- [DEVELOPMENT MODE] Email Fallback (Error) ---");
                logger.info(`To: ${to}`);
                logger.info(`Subject: ${subject}`);
                logger.info(`Content: ${html}`);
                logger.info("-------------------------------------------------");
                return true; // Return true in dev to prevent blocking the flow
            }
            return false;
        }
    }
}

export default new ResendAdapter();
