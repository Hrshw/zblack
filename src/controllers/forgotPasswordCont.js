const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const Register = require('../database/userschema');

const sendMail = async (email) => {
  try {
    const user = await Register.findOne({ email });

    if (!user) {
      return { error: 'User not found' };
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '15m' });

    user.resetPasswordToken = token;
    await user.save();

    const resetLink = `${req.protocol}://${req.get('host')}/resetpassword?token=${token}`;

    let transporter = await nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: 'torrance.morar@ethereal.email',
        pass: 'q32ge63b5rQ8xqnMZR'
      },
    });

    let info = await transporter.sendMail({
      from: '"ZBlack" <thapa@gmail.com>', // Sender address
      to: email, // List of receivers
      subject: "Password Reset Request", // Subject line
      text: `Click the link below to reset your password:\n\n${resetLink}`, // Plain text body
    });

    console.log("Password reset email sent to:", email);
    console.log("Message sent: %s", info.messageId);

    return { message: 'Password reset instructions sent to your email.' };
  } catch (error) {
    console.error('Failed to process password reset request:', error);
    return { error: 'Failed to process password reset request' };
  }
};

module.exports = { sendMail };
