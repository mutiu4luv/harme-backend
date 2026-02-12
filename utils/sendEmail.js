// // utils/sendEmail.js
// const brevo = require("@getbrevo/brevo");

// const sendEmail = async ({ email, subject, html }) => {
//   try {
//     const apiInstance = new brevo.TransactionalEmailsApi();

//     // Use your API key from .env
//     apiInstance.setApiKey(
//       brevo.TransactionalEmailsApiApiKeys.apiKey,
//       process.env.BREVO_API_KEY
//     );

//     const sendSmtpEmail = new brevo.SendSmtpEmail();
//     sendSmtpEmail.sender = {
//       name: "De-Harmelodic Chorale",
//       email: process.env.BREVO_VERIFIED_EMAIL,
//     };
//     sendSmtpEmail.to = [{ email }];
//     sendSmtpEmail.subject = subject;
//     sendSmtpEmail.htmlContent = html;

//     const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
//     return response;
//   } catch (err) {
//     console.error("Forgot Password Error (Brevo API):", err);
//     throw new Error("Failed to send email");
//   }
// };

// module.exports = sendEmail;
