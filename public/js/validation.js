  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    // const otp = document.getElementById('otp');
    const phone = document.getElementById('phone')
    // const referralnumber = document.getElementById('referralnumber');
    const password2 = document.getElementById('confirmpassword');

    form.addEventListener('submit', e => {
        e.preventDefault();
        validateInputs()
         
    });

    const setError = (element, message) => {
        const inputControl = element.parentElement;
        const errorDisplay = inputControl.querySelector('.error');

        errorDisplay.innerText = message;
        inputControl.classList.add('error');
        inputControl.classList.remove('success')
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
        // const otpValue = otp.value.trim();
        const phoneValue = phone.value.trim();
        // const referralNumberValue = referralnumber.value.trim();
      
         {
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
            setError(phone, 'phone number is required');
          } else if (!isValidPhone(phoneValue)) {
            setError(phone, 'phone number must be at least 10 characters');
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
      
        }

          form.submit();
      };
});
