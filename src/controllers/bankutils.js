// utils/bankUtils.js

// Define a function to validate account numbers based on bank name
function isValidAccountNumber(accountNumber, bankName) {
    // Remove any whitespace from the account number
    const trimmedAccountNumber = accountNumber.trim();
  
    // Convert both bank name input and bank names in code to lowercase
    const lowercaseBankNameInput = bankName.toLowerCase();
  
    // Apply specific validation rules based on bank
    if (lowercaseBankNameInput === 'sbi' || lowercaseBankNameInput === 'state bank') {
      // Validation rules for SBI bank account number (example)
      if (trimmedAccountNumber.length !== 11 || !/^\d+$/.test(trimmedAccountNumber)) {
        return false;
      }
    } else if (lowercaseBankNameInput === 'hdfc') {
      // Validation rules for HDFC bank account number (example)
      if (trimmedAccountNumber.length !== 14 || !/^\d+$/.test(trimmedAccountNumber)) {
        return false;
      }
    } else if (lowercaseBankNameInput === 'icici') {
      // Validation rules for ICICI bank account number (example)
      if (trimmedAccountNumber.length !== 12 || !/^\d+$/.test(trimmedAccountNumber)) {
        return false;
      }
    } else if (lowercaseBankNameInput === 'axis') {
      // Validation rules for AXIS bank account number (example)
      if (trimmedAccountNumber.length !== 12 || !/^\d+$/.test(trimmedAccountNumber)) {
        return false;
      }
    }
    // Add more bank-specific validation rules as needed
  
    // Return true if the account number is valid
    return true;
  }
  
  module.exports = { isValidAccountNumber };
  