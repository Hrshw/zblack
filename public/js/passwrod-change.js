document.addEventListener('DOMContentLoaded', function() {
  var forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Retrieve the form data
      var mobileNumber = document.getElementById('mobileNumber').value;

      // Send an AJAX request to the server
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/forgot-password', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = function() {
        if (xhr.status === 200) {
          // Password reset instructions sent successfully
          var response = JSON.parse(xhr.responseText);
          var flashSuccessMessage = document.getElementById('flashSuccessMessage');
          if (flashSuccessMessage) {
            flashSuccessMessage.innerHTML = response.message;
            flashSuccessMessage.style.display = 'block';
            setTimeout(function() {
              flashSuccessMessage.style.display = 'none';
              window.location.href = '/'; // Redirect to the home page
            }, 5000); // Display the message for 5 seconds
          }
        } else {
          // Failed to process password reset request
          var flashErrorMessage = document.getElementById('flashErrorMessage');
          if (flashErrorMessage) {
            flashErrorMessage.innerHTML = 'Failed to process password reset request: ' + xhr.statusText;
            flashErrorMessage.style.display = 'block';
          }
        }
      };
      xhr.onerror = function() {
        // Failed to process password reset request
        var flashErrorMessage = document.getElementById('flashErrorMessage');
        if (flashErrorMessage) {
          flashErrorMessage.innerHTML = 'Failed to process password reset request';
          flashErrorMessage.style.display = 'block';
        }
      };
      xhr.send(JSON.stringify({ mobileNumber: mobileNumber }));
    });
  }

  var resetPasswordForm = document.getElementById('resetPasswordForm');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Retrieve the form data
      var token = document.getElementById('token').value;
      var newPassword = document.getElementById('newPassword').value;
      var confirmPassword = document.getElementById('confirmPassword').value;

      // Validate the password fields
      if (newPassword !== confirmPassword) {
        var flashErrorMessage = document.getElementById('flashErrorMessage');
        if (flashErrorMessage) {
          flashErrorMessage.innerHTML = 'Passwords do not match';
          flashErrorMessage.style.display = 'block';
        }
        return;
      }

      // Send an AJAX request to the server
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/reset-password', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = function() {
        if (xhr.status === 200) {
          // Password reset successful
          var response = JSON.parse(xhr.responseText);
          var flashSuccessMessage = document.getElementById('flashSuccessMessage');
          if (flashSuccessMessage) {
            flashSuccessMessage.innerHTML = response.message;
            flashSuccessMessage.style.display = 'block';
            setTimeout(function() {
              flashSuccessMessage.style.display = 'none';
              window.location.href = '/login'; // Redirect to the login page
            }, 3000); // Display the message for 3 seconds
          }
        } else {
          // Failed to reset password
          var flashErrorMessage = document.getElementById('flashErrorMessage');
          if (flashErrorMessage) {
            flashErrorMessage.innerHTML = 'Failed to reset password: ' + xhr.statusText;
            flashErrorMessage.style.display = 'block';
            setTimeout(function() {flashErrorMessage.style.display = 'none';
          }, 3000); // Display the message for 3 seconds
          }
          }
          };
          xhr.onerror = function() {
          // Failed to reset password
          var flashErrorMessage = document.getElementById('flashErrorMessage');
          if (flashErrorMessage) {
          flashErrorMessage.innerHTML = 'Failed to reset password';
          flashErrorMessage.style.display = 'block';
          setTimeout(function() {
          flashErrorMessage.style.display = 'none';
          }, 3000); // Display the message for 3 seconds
          }
          };
          xhr.send(JSON.stringify({ token: token, newPassword: newPassword }));
          });
          }
          });
          
          // Show/hide password
          var showPasswordToggle = document.getElementById('showPasswordToggle');
          if (showPasswordToggle) {
          var passwordField = document.getElementById('newPassword');
          showPasswordToggle.addEventListener('click', function() {
          if (passwordField.type === 'password') {
          passwordField.type = 'text';
          showPasswordToggle.textContent = 'Hide';
          } else {
          passwordField.type = 'password';
          showPasswordToggle.textContent = 'Show';
          }
          });
          }
