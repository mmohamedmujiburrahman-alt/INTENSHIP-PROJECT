import nodemailer from "nodemailer";

// Create a transporter object using SMTP settings
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.sendEmail,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, body) => {
    const response = await transporter.sendMail({
        from: process.env.sendEmail,
        to,
        subject,
        html: body,
    })
    return response;
}

export default sendEmail;
