 // JavaScript code on the signup page
 const urlParams = new URLSearchParams(window.location.search);
 const referralCode = urlParams.get('referral');

 if (referralCode) {
   const referralNumberField = document.getElementById('referralnumber');
   referralNumberField.value = referralCode;
 }

// ...................................//
const phoneNumberInput = document.querySelector('input[name="phone"]');
const sendOtpMessage = document.querySelector('#send-otp-message');

phoneNumberInput.addEventListener('change', async (event) => {
  const phoneNumber = event.target.value;

  if (!phoneNumber) {
    return;
  }

  const response = await fetch('/sendotp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber
    })
  });

  const data = await response.json();

  if (data.success) {
    sendOtpMessage.innerText = 'OTP sent successfully!';
  } else {
    sendOtpMessage.innerText = 'Failed to send OTP';
  }
});
