const nodemailer = require('nodemailer');

// Create a transporter object

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendVerificationEmail = async (email, code) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your Customer Loyalty account',
        text: `Your verification code is ${code}. This code will expire in 10 minutes`,
    });
};

module.exports = sendVerificationEmail;

