import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

class ResendAdapter {
    constructor() {
        if (!process.env.RESEND_API_KEY) {
            console.warn("RESEND_API_KEY is not set");
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
                console.error("Error sending email via Resend:", error);
                
                if (process.env.NODE_ENV === "development") {
                    console.log("\x1b[33m%s\x1b[0m", "--- [DEVELOPMENT MODE] Email Output ---");
                    console.log(`To: ${to}`);
                    console.log(`Subject: ${subject}`);
                    console.log(`Content: ${html}`);
                    console.log("\x1b[33m%s\x1b[0m", "---------------------------------------");
                    return true; // Return true in dev to prevent blocking the flow
                }
                return false;
            }

            console.log("Email sent successfully via Resend:", data.id);
            return true;
        } catch (error) {
            console.error("Unexpected error sending email via Resend:", error);
            
            if (process.env.NODE_ENV === "development") {
                console.log("\x1b[33m%s\x1b[0m", "--- [DEVELOPMENT MODE] Email Fallback (Error) ---");
                console.log(`To: ${to}`);
                console.log(`Subject: ${subject}`);
                console.log(`Content: ${html}`);
                console.log("\x1b[33m%s\x1b[0m", "-------------------------------------------------");
                return true; // Return true in dev to prevent blocking the flow
            }
            return false;
        }
    }
}

export default new ResendAdapter();
