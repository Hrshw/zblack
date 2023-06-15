const Register = require('../database/userschema');

// Middleware function to check payment status and account creation date
const checkPaymentStatus = async (req, res, next) => {
  try {
    // Check if the user is logged in
    if (!req.session.userId) {
      // User is not logged in, redirect to the login page
      return res.redirect('/login');
    }

    // Get the user data
    const user = await Register.findById(req.session.userId);

    // Check if the user has made the payment
    if (!user.paymentMade) {
      // User has not made the payment, redirect to the payment required page
      return res.redirect('/payment-required');
    }

    // User has made the payment, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.log(error);
    // Handle errors
    res.render('error-page');
  }
};

module.exports = { checkPaymentStatus };
