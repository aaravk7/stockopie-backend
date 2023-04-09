const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: "phoenixera7@gmail.com",
        pass: "AaravK@7",
    },
    secure: true,
});

module.exports = transporter;