const Register = require('../database/userschema')

// Middleware function to check payment status and account creation date
const checkPaymentStatus = async (req, res, next) => {
    try {
      // Check if the user is logged in
      if (!req.session.userId) {
        // User is not logged in, redirect to the login page
        return res.redirect('/login');
      }
  
      // Check if the user account has been created for more than 4 days
      const user = await Register.findById(req.session.userId);
      const accountCreationDate = user.createdAt;
      const currentDate = new Date();
      const daysElapsed = Math.floor((currentDate - accountCreationDate) / (1000 * 60 * 60 * 24));
  
      if (daysElapsed < 4) {
        // Account is not older than 4 days, redirect to a waiting page or show an appropriate message
        return res.render('account-waiting');
      }
  
      // Check if the user has made the payment
      if (!user.paymentMade) {
        // User has not made the payment, redirect to a payment page or show an error message
        return res.render('payment-required');
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