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

