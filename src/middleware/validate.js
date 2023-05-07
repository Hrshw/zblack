const { body, validationResult } = require('express-validator');
const User = require("../database/userschema");

exports.userRegistrationValidator = [
  body('username')
    .not().isEmpty().trim().withMessage('Username is required')
    .custom(async (value) => {
      const user = await User.findOne({ username: value });
      if (user) {
        throw new Error('Username is already in use');
      }
      return true;
    }),
  body('email')
    .not().isEmpty().trim().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error('Email is already in use');
      }
      return true;
    }),
  body('phone')
    .not().isEmpty().withMessage('Phone number is required')
    .isNumeric().withMessage('Phone number should be numeric')
    .isLength({ min: 10, max: 12 }).withMessage('Phone number should be 10 digits long')
    .custom(async (value) => {
      const user = await User.findOne({ phone: value });
      if (user) {
        throw new Error('Phone number is already in use');
      }
      return true;
    }),
  body('otp').not().isEmpty().withMessage('OTP is required')
    .isNumeric().withMessage('OTP should be numeric')
    .isLength({ min: 6, max: 6 }).withMessage('OTP should be 6 digits long'),
  body('password').not().isEmpty().trim().withMessage('Password is required'),
  body('confirmpassword').not().isEmpty().trim().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  async (req, res, next) => {
    console.log('userRegistrationValidator middleware executed');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.render('signup', {
        alert: errors.array()
      });
    }
    req.body.referralcode = 'generated-referral-code'; // replace with your referral code generation logic
    req.body.sponsorid = 'generated-sponsor-id'; // replace with your sponsor id generation logic
    next();
  }
];
