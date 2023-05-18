const axios = require('axios');

function sendPasswordResetSMS(apiKey, message, mobileNumber) {
  const apiUrl = process.env.APIKEYFAST;

  const payload = {
    sender_id: 'FSTSMS',
    message: message,
    language: 'english',
    route: 'qt',
    numbers: mobileNumber,
  };

  const headers = {
    authorization: apiKey,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cache-Control': 'no-cache',
  };

  return axios
    .post(apiUrl, new URLSearchParams(payload), { headers })
    .then((response) => {
      console.log('Password reset SMS sent successfully');
      console.log('Response:', response.data);
    })
    .catch((error) => {
      console.error('Failed to send password reset SMS');
      if (error.response && error.response.data) {
        console.error('Error:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    });
}

module.exports = sendPasswordResetSMS;
