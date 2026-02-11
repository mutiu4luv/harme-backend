const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: process.env.BREVO_SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const sendEmail = async (options) => {
  await transporter.sendMail({
    from: `"De-Harmelodic Chorale" <${process.env.BREVO_SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  });
};

module.exports = sendEmail;
