const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return null;
    }
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }
    return transporter;
}

module.exports.sendMail = async ({ to, subject, html }) => {
    const t = getTransporter();
    if (!t) {
        console.log("Email not configured — skipping:", subject);
        return;
    }
    try {
        await t.sendMail({
            from: `"Wanderlust" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html
        });
    } catch (err) {
        console.log("Failed to send email:", err.message);
    }
};
