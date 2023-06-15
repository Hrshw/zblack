const Register = require('../database/userschema');

// Route handler for user page
const checkPaymentStatus = async (req, res) => {
  try {
    // Check if the user is logged in
    if (!req.session.userId) {
      // User is not logged in, redirect to the login page
      return res.render('login');
    }

    // Get the user data
    const user = await Register.findById(req.session.userId);

    // Check if the user has made the payment
    if (!user.paymentMade) {
      // User has not made the payment, redirect to the payment required page
      return res.render('payment-required');
    }

    // User has made the payment, render the user page and pass the user data
    return res.render('user', { user });
  } catch (error) {
    console.log(error);
    // Handle errors
    res.render('error-page');
  }
};

module.exports = { checkPaymentStatus };
