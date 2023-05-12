document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const username = document.getElementById('username');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const phone = document.getElementById('phone')
  const password2 = document.getElementById('confirmpassword');
  const referralCode = document.getElementById('referralnumber');
  const otp = document.getElementById('otp')

  form.addEventListener('submit', e => {
    e.preventDefault();
    validateInputs();
  });

  const setError = (element, message) => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.error');

    errorDisplay.innerText = message;
    inputControl.classList.add('error');
    inputControl.classList.remove('success');
  }

  const setSuccess = element => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.error');

    errorDisplay.innerText = '';
    inputControl.classList.add('success');
    inputControl.classList.remove('error');
  };

  const isValidEmail = email => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  const isValidPhone = phone => {
    const re = /^\d{10}$/;
    return re.test(phone);
  };

  const validateInputs = async () => {
    const usernameValue = username.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();
    const password2Value = password2.value.trim();
    const phoneValue = phone.value.trim();
    const referralCodeValue = referralCode.value.trim();
    const otpValue = otp.value.trim();

    if (usernameValue === '') {
      setError(username, 'Username is required');
    } else {
      setSuccess(username);
    }

    if (emailValue === '') {
      setError(email, 'Email is required');
    } else if (!isValidEmail(emailValue)) {
      setError(email, 'Provide a valid email address');
    } else {
      setSuccess(email);
    }

    if (phoneValue === '') {
      setError(phone, 'Phone number is required');
    } else if (!isValidPhone(phoneValue)) {
      setError(phone, 'Phone number must be 10 digits');
    } else {
      setSuccess(phone);
    }

    if (passwordValue === '') {
      setError(password, 'Password is required');
    } else if (passwordValue.length < 8) {
      setError(password, 'Password must be at least 8 characters');
    } else {
      setSuccess(password);
    }

    if (password2Value === '') {
      setError(password2, 'Please confirm your password');
    } else if (password2Value !== passwordValue) {
      setError(password2, "Passwords don't match");
    } else {
      setSuccess(password2);
    }

    if (referralCodeValue === '') {
      setError(referralCode, 'Referral code is required');
    } else {
      const response = await fetch(`/check-referral-code/${referralCodeValue}`);
      const data = await response.json();
  
      if (response.ok && data.isValidReferralCode) {
        setSuccess(referralCode);
      } else {
        setError(referralCode, data.referralCodeErrorMessage);
      }
    }
    if (otpValue === '') {
      setError(otp, 'OTP is required');
    } else if (otpValue.length !== 6) {
      setError(otp, 'OTP must be 6 digits');
    } else {
      setSuccess(otp);
  
      const response = await fetch(`/validate-otp/${otpValue}`);
      const data = await response.json();
  
      if (response.ok && data.isValidOTP) {
        // OTP validation successful, submit the form
        form.submit();
      } else {
        // OTP validation failed, show error message
        setError(otp, 'Invalid OTP');
      }
    }

    const response = await fetch(`/check-existing?username=${usernameValue}&email=${emailValue}&phone=${phoneValue}`);
    const data = await response.json();

    if (response.ok) {
      // No user found with this username, email, or phone number
    } else {
      // Show error messages for each field that already exists
      const errors = data.errors;
      if (errors.username) {
        setError(username, errors.username);
      }
      if (errors.email) {
        setError(email, errors.email);
      }
      if (errors.phone) {
        setError(phone, errors.phone);
      }
    } 

  
  };
});
