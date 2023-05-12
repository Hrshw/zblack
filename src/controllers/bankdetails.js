const Register = require('../database/userschema');
const { isValidAccountNumber } = require('../controllers/bankutils');

const updateBankDetails = async (req, res) => {
  const { bankName, accountNumber, accountNumberVerification, ifscCode, cardType, cardNumber } = req.body;
  const userId = req.user.id;

  // Check if any field is empty or undefined
  if (
    !bankName ||
    !accountNumber ||
    !accountNumberVerification ||
    !ifscCode ||
    !cardType ||
    !cardNumber ||
    !bankName.trim() ||
    !accountNumber.trim() ||
    !accountNumberVerification.trim() ||
    !ifscCode.trim() ||
    !cardNumber.trim()
  ) {
    return res.status(400).json({ success: false, message: 'Please fill in all the required fields.' });
  }

  // Check if the account numbers match
  if (accountNumber.trim() !== accountNumberVerification.trim()) {
    return res.status(400).json({ success: false, message: 'Account numbers do not match.' });
  }

  // Validate the length and format of account number based on bank name
  const isValidAccountNum = isValidAccountNumber(accountNumber, bankName);
  if (!isValidAccountNum) {
    return res.status(400).json({ success: false, message: 'Invalid account number format.' });
  }

  // Validate the length and format of IFSC code
  if (ifscCode.trim().length !== 11 || !/^[A-Za-z]{4}\d{7}$/.test(ifscCode.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid IFSC code format.' });
  }

  // Check if the card type is valid
  if (cardType !== 'panCard' && cardType !== 'aadharCard') {
    return res.status(400).json({ success: false, message: 'Invalid card type.' });
  }

  // Validate the length and format of card number
  if (cardType === 'panCard') {
    if (cardNumber.trim().length !== 10 || !/^[A-Za-z]{5}\d{4}[A-Za-z]{1}$/.test(cardNumber.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid PAN card number format.' });
    }
  } else if (cardType === 'aadharCard') {
    if (cardNumber.trim().length !== 12 || !/^\d+$/.test(cardNumber.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid Aadhar card number format.' });
    }
  } else {
    return res.status(400).json({ success: false, message: 'Invalid card type.' });
  }

  const updateFields = {
    bankDetails: {
      bankName,
      accountNumber,
      ifscCode,
      panCard: cardType === 'panCard' ? cardNumber : null,
      aadharCard: cardType === 'aadharCard' ? cardNumber : null
    }
  };

  try {
    // Update the user with the new bank details
    const updatedUser = await Register.findByIdAndUpdate(userId, updateFields, { new: true });

    if (updatedUser) {
      return res.json({ success: true, message: 'Bank details updated successfully.' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to update bank details.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { updateBankDetails };