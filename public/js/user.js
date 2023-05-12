 $('#logout-button').on('click', function () {
            $.ajax({
                url: '/logout',
                method: 'POST',
                success: function (response) {
                    // Handle successful logout, such as redirecting the user to the login page
                    window.location.href = '/login';
                },
                error: function (error) {
                    // Handle error, such as displaying an error message to the user
                    console.log(error);
                }
            });
        });




        document.addEventListener('DOMContentLoaded', () => {
          const form = document.getElementById('form');
          const bankName = document.getElementById('bankName');
          const accountNumber = document.getElementById('accountNumber');
          const ifscCode = document.getElementById('ifscCode');
          const panCard = document.getElementById('panCard');
          const aadharCard = document.getElementById('aadharCard');
          const cardNumber = document.getElementById('cardNumber');
          const accountNumberVerification = document.getElementById('accountNumberVerification');

          form.addEventListener('submit', e => {
              e.preventDefault();
              validateInputs();
          });

          const setError = (element, message) => {
              const inputControl = element.parentElement;
              const errorDisplay = inputControl.querySelector('.error');
            
              if (errorDisplay) {
                errorDisplay.innerText = message;
            
                // Hide the error message after 5 seconds
                setTimeout(() => {
                  errorDisplay.innerText = '';
                }, 5000);
              }
            
              if (inputControl) {
                inputControl.classList.add('error');
                inputControl.classList.remove('success');
            
                // Remove the error class after 5 seconds
                setTimeout(() => {
                  inputControl.classList.remove('error');
                }, 5000);
              }
            };

          const setSuccess = element => {
              const inputControl = element.parentElement;
              const errorDisplay = inputControl.querySelector('.error');
            
              if (errorDisplay) {
                errorDisplay.innerText = '';
              }
            
              if (inputControl) {
                inputControl.classList.add('success');
                inputControl.classList.remove('error');
            
                // Remove the success class after 5 seconds
                setTimeout(() => {
                  inputControl.classList.remove('success');
                }, 5000);
              }
            };


          const isValidBankAccountNumber = accountNumber => {
              // Implement your validation logic here
              // Example: Check if the account number is a valid format
              const re = /^[0-9]{9,18}$/; // Modify the regular expression as per your requirements
              return re.test(accountNumber);
          };

          const isValidIFSCCode = ifscCode => {
              // Implement your validation logic here
              // Example: Check if the IFSC code is a valid format
              const re = /^[A-Za-z]{4}[0][A-Za-z0-9]{6}$/; // Modify the regular expression as per your requirements
              return re.test(ifscCode);
          };

          const isValidCardNumber = (cardType, cardNumber) => {
              // Implement your validation logic here
              // Example: Check if the card number is a valid format based on the card type
              let re;
              if (cardType === 'panCard') {
                  // Example: Validate PAN Card number format
                  re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/; // Modify the regular expression as per your requirements
              } else if (cardType === 'aadharCard') {
                  // Example: Validate Aadhar Card number format
                  re = /^[0-9]{12}$/; // Modify the regular expression as per your requirements
              } else {
                  // Invalid card type
                  return false;
              }

              return re.test(cardNumber);
          };

          const validateInputs = async () => {
              const bankNameValue = bankName.value.trim();
              const accountNumberValue = accountNumber.value.trim();
              const accountNumberVerificationValue = accountNumberVerification.value.trim();
              const ifscCodeValue = ifscCode.value.trim();
              const cardTypeValue = panCard.checked ? 'panCard' : aadharCard.checked ? 'aadharCard' : '';
              const cardNumberValue = cardNumber.value.trim();
              let isValid = true; // Add a flag to track input validity

              if (bankNameValue === '') {
                  setError(bankName, 'Bank Name is required');
                  isValid = false; // Set validity flag to false
              } else {
                  setSuccess(bankName);
              }

              if (accountNumberValue === '') {
                  setError(accountNumber, 'Account Number is required');
                  isValid = false; // Set validity flag to false
              } else if (!isValidBankAccountNumber(accountNumberValue)) {
                  setError(accountNumber, 'Invalid Bank Account Number');
                  isValid = false; // Set validity flag to false
              } else {
                  setSuccess(accountNumber);
              }

              if (accountNumberVerificationValue === '') {
                setError(accountNumberVerification, 'Account Number Verification is required');
                isValid = false; // Set validity flag to false
              } else if (accountNumberVerificationValue !== accountNumberValue) {
                setError(accountNumberVerification, 'Account Numbers do not match');
                isValid = false; // Set validity flag to false
              } else {
                setSuccess(accountNumberVerification);
              }

              if (ifscCodeValue === '') {
                  setError(ifscCode, 'IFSC Code is required');
                  isValid = false; // Set validity flag to false
              } else if (!isValidIFSCCode(ifscCodeValue)) {
                  setError(ifscCode, 'Invalid IFSC Code');
                  isValid = false; // Set validity flag to false
              } else {
                  setSuccess(ifscCode);
              }

              if (cardTypeValue === '') {
                  setError(panCard, 'Please select a card type');
                  setError(aadharCard, 'Please select a card type');
                  isValid = false; // Set validity flag to false
              } else {
                  setSuccess(panCard);
                  setSuccess(aadharCard);

                  if (cardNumberValue === '') {
                      setError(cardNumber, 'Card number is required');
                      isValid = false; // Set validity flag to false
                  } else if (!isValidCardNumber(cardTypeValue, cardNumberValue)) {
                      setError(cardNumber, 'Invalid card number format');
                      isValid = false; // Set validity flag to false
                  } else {
                      setSuccess(cardNumber);
                  }
              }

             if (isValid) {
  try {
    const requestData = {
      bankName: bankNameValue,
      accountNumber: accountNumberValue,
      accountNumberVerification: accountNumberVerificationValue,
      ifscCode: ifscCodeValue,
      cardType: cardTypeValue,
      cardNumber: cardNumberValue
    };

    const response = await fetch('/user/updateBankDetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Show success message to the user
        const successMessage = document.getElementById('successMessage');
        successMessage.innerText = data.message;
        successMessage.style.display = 'block';
        form.reset();

        // Hide success message after 7 seconds
        setTimeout(() => {
          successMessage.style.display = 'none';
        }, 7000);
      } else {
        // Show error message to the user
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.innerText = data.message;
        errorMessage.style.display = 'block';
      }
    } else {
      // Show error message to the user
      const errorMessage = document.getElementById('errorMessage');
      errorMessage.innerText = 'An error occurred. Please try again later.';
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error(error);
    // Show error message to the user
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.innerText = 'An error occurred. Please try again later.';
    errorMessage.style.display = 'block';
  }
}
          };
      });






        const userSection = document.querySelector('.userSection');
        const showDetailButton = document.querySelector('.showDetailButton');
        const withdrawalFormButton = document.querySelector('.withdrawalFormButton');
        const withdrawalHistoryButton = document.querySelector('.withdrawalHistoryButton');
        const contactUsButton = document.querySelector('.contactUsButton');
        const bankDetailButton = document.querySelector('.bankDetailButton');
        const userHomeButton = document.querySelector('.userHomeButton');

        const showDetailsSection = document.querySelector('.showDetailsSection');
        const withdrawalSection = document.querySelector('.withdrawalSection');
        const withdrawalHistorySection = document.querySelector('.withdrawalHistorySection');
        const contactUsSection = document.querySelector('.contactUsSection');
        const bankDetailsSection = document.querySelector('.bankDetailsSection');

        // Function to hide all sections
        function hideAllSections() {
            showDetailsSection.classList.add('d-none');
            withdrawalSection.classList.add('d-none');
            withdrawalHistorySection.classList.add('d-none');
            contactUsSection.classList.add('d-none');
            bankDetailsSection.classList.add('d-none');
            userSection.classList.add('d-none');
        }

        // Event listeners for navigation buttons
        showDetailButton.addEventListener('click', () => {
            hideAllSections();
            showDetailsSection.classList.remove('d-none');
        });

        withdrawalFormButton.addEventListener('click', () => {
            hideAllSections();
            withdrawalSection.classList.remove('d-none');
        });

        withdrawalHistoryButton.addEventListener('click', () => {
            hideAllSections();
            withdrawalHistorySection.classList.remove('d-none');
        });

        contactUsButton.addEventListener('click', () => {
            hideAllSections();
            contactUsSection.classList.remove('d-none');
        });

        bankDetailButton.addEventListener('click', () => {
            hideAllSections();
            bankDetailsSection.classList.remove('d-none');
        });

        userHomeButton.addEventListener('click', () => {
            hideAllSections();
            userSection.classList.remove('d-none');
        });

