sendOtpBtn.addEventListener('click', async (event) => {
    event.preventDefault();
  
    // Get the user's phone number from the input field
    const phoneNumber = document.querySelector('input[name="phone"]').value;
   // Check if phone number is empty
   if (!phoneNumber) {
    console.log('Please enter a phone number');
    return;
  }
    // Send a POST request to the server to send OTP
    const response = await fetch('http://localhost:3000/sendotp', {
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
      console.log('OTP sent successfully!');
      // Show the OTP input field and the verify button
      verifyOtpBtn.classList.remove('d-none');
      // Hide the send OTP button
      sendOtpBtn.classList.add('d-none');
    } else {
      console.log('Failed to send OTP');
    }
  });
  
  verifyOtpBtn.addEventListener('click', async (event) => {
    event.preventDefault();
  
    // Get the user's phone number and OTP from the input fields
    const phoneNumber = document.querySelector('input[name="phone"]').value;
    const otp = document.querySelector('input[name="otp"]').value;
  
    // Send a POST request to the server to verify OTP
    const response = await fetch('http://localhost:3000/verifyotp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber,
    otp
  })
});

if (!response.ok) {
  console.log('Failed to verify OTP');
  return;
}

const data = await response.json();

if (data.success) {
  console.log('OTP verified successfully!');
} else {
  console.log('Failed to verify OTP');
}

  });
  