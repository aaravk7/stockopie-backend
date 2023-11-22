const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  port: 465,
  host: "smtp.gmail.com",
  auth: {
    user: process.env.GMAIL_Id,
    pass: process.env.GMAIL_PASSWORD,
  },
  secure: true,
});

module.exports = transporter;
