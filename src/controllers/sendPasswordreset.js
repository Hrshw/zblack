const SibApiV3Sdk = require('sendinblue-api');
const sendinblue = new SibApiV3Sdk.ApiClient();
sendinblue.setApiKey('YOUR_API_KEY');

async function sendPasswordResetEmail(email, resetLink) {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = 'Password Reset Request';
    sendSmtpEmail.htmlContent = `<p>Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`;
    sendSmtpEmail.sender = { name: 'Your Name', email: 'yourname@example.com' };
    sendSmtpEmail.to = [{ email }];

    const response = await sendinblue.sendTransacEmail(sendSmtpEmail);
    console.log('Password reset email sent successfully:', response);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
}

module.export = sendPasswordResetEmail;