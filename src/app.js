require('dotenv').config({ path: '../.env' });
const express = require('express');
const path = require('path');
const app = express();
// const axios = require('axios');
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { registerPartials } = require("hbs");
const bodyParser = require('body-parser');
const helpers = require('./middleware/helpers');
const auth = require("./middleware/auth");
const { validationResult } = require('express-validator');
const shortid = require('shortid');
const { userRegistrationValidator } = require('./middleware/validate');
const { validateReferralCode } = require('./middleware/checkReferrels');
const handleReferral = require('./controllers/updatecoins');
const { updateBankDetails } = require('./controllers/bankdetails');
const session = require('express-session');
const fast2sms = require('fast-two-sms');
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const speakeasy = require('speakeasy');
const cors = require('cors')


app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));

// database related code
require("./database/conn");
const Register = require("./database/userschema");

const port = process.env.PORT || 3000;

const staticpath = path.join(__dirname, "../public");
const templetespath = path.join(__dirname, "templates/views");

const partialspath = path.join(__dirname, "templates/partials");

// Enable CORS for all routes
app.use(cors());

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
const urlencoded = bodyParser.urlencoded({ extended: false });


// middlewares
app.use('/css', express.static(path.join(__dirname, "../node_modules/bootstrap/dist/css")));
app.use('/js', express.static(path.join(__dirname, "../node_modules/bootstrap/dist/js")));
app.use('/js', express.static(path.join(__dirname, "../node_modules/bootstrap/dist/bundle.min.js")));
app.use('/jq', express.static(path.join(__dirname, "../node_modules/jquery/dist")));
app.use('/js', express.static(path.join(__dirname, "../node_modules/validate.js")));
app.use(express.static(staticpath));
app.set("view engine", "hbs");
app.set("views", templetespath);
hbs.registerPartials(partialspath);


app.get('/', (req, res) => {
  res.render('index');
});
app.get('/about', (req, res) => {
  res.render('about');
});
app.get('/support', (req, res) => {
  res.render('support');
});
app.get('/checkout', auth, (req, res) => {
  if (!req.user) {
    // User is not authenticated, show error message or redirect to login page
    res.send('You must be logged in to access the checkout page.');
  } else {
    // User is authenticated, render the checkout page
    res.render('checkout');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});


app.post('/login', async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const user = await Register.findOne({ username: username });

    if (!user) {
      const errorMessage = "Invalid username!";
      return res.render('login', { errorMessage });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = await user.generateAuthToken();
      // save cookie
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 10800000),
        httpOnly: true
      });
      req.session.userId = user._id; // store the user ID in the session
      res.redirect('/user');
    } else {
      const errorMessage = "Invalid password!";
      res.render('login', { errorMessage });
    }

  } catch (error) {
    console.log(error);
    const errorMessage = "Invalid credentials!";
    res.render('login', { errorMessage });
  }
});





app.post('/logout', auth, async (req, res) => {
  try {
    if (!req.user) {
      // If req.user is undefined, the user is not logged in
      return res.redirect('/login');
    }

    // Remove the user's token from the tokens array
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);

    // Save the updated user document
    await req.user.save();

    // Clear the cookie
    res.clearCookie('jwt');

    res.redirect('/');
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});



app.get('/user', auth, async (req, res) => {
  try {
    const user = await Register.findById(req.session.userId)
      .populate('referredUsers', 'coins referralCode') // populate referredUsers field with the coins and referralCode fields of referred users
      .exec();

    if (!user) {
      return res.redirect('/login');
    }

    // Calculate the coins for direct and indirect referred users
    const directCoins = user.directReferredUsers * 20;
    const indirectCoins = user.indirectReferredUsers * 10;

    const userCount = await getUserCount();
    const userLoggedIn = true; // Set userLoggedIn to true since the user is logged in

    res.render('user', { user, userCount, directCoins, indirectCoins, userLoggedIn });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.redirect('/login');
    }
    console.log(error);
    res.status(500).send('Server Error');
  }
});
app.post('/user/updateBankDetails', auth, updateBankDetails);


app.get('/signup', (req, res) => {
  res.render('signup');
});

// Define a function to retrieve the total number of users
async function getUserCount() {
  const count = await Register.countDocuments();
  return count;
}


app.post('/signup', validateReferralCode, userRegistrationValidator, urlencoded, async (req, res) => {
  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are validation errors, render the registration form with error messages
    const alert = errors.array();
    return res.render('signup', { alert });
  }

  // Generate referral code and sponsor ID
  const referralCode = shortid.generate();
  const sponsorId = shortid.generate();

  const { username, email, phone, otp, password, confirmpassword, referredUsers } = req.body;

   // Verify OTP
  //  const secret = process.env.SECRET_KEY;
  //  const isOTPValid = speakeasy.totp.verify({ secret, token: otp, window: 5 * 60 });
  //  if (!isOTPValid) {
  //    return res.render('signup', { alert: [{ msg: 'Invalid OTP. Please enter a valid OTP.' }] });
  //  }
  const referredBy = req.referrer ? req.referrer.referralCode : null;
  const registeruser = new Register({
    username,
    email,
    phone,
    otp,
    password,
    confirmpassword,
    referralCode,
    sponsorId,
    referredUsers,
    referredBy,
    coins: 0,
    directReferredUsers: 0,
    indirectReferredUsers: 0
  });

  // Add referred users to the user's document
  if (req.referrer) {
    const referrer = await Register.findOne({ referralCode: referredBy });
    if (referrer) {
      registeruser.referralChain = [...referrer.referralChain, referredBy];
      referrer.referredUsers.push(registeruser._id);
      await referrer.save();

      // Give coins to all previous referrers
      let currentReferrer = referrer;
      while (currentReferrer) {
        currentReferrer.coins += 10;
        await currentReferrer.save();
        currentReferrer = await Register.findOne({ referralCode: currentReferrer.referredBy });
      }
    }
  }
  const token = await registeruser.generateAuthToken();
  // Save cookie
  res.cookie('jwt', token, {
    expires: new Date(Date.now() + 10800000),
    httpOnly: true,
  });

  try {
    await registeruser.save();
    console.log('User saved to database');

    // Handle referral
    const handleReferralResult = await handleReferral(referralCode, referredBy);
    console.log(handleReferralResult);

    res.redirect('/login');
  } catch (error) {
    console.log(error);
    res.redirect('/signup');
  }
});






// Generate and send OTP to user's phone number
app.post('/sendotp', async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const otp = speakeasy.totp({
    secret: process.env.SECRET_KEY,
    digits: 6,
    window: 5 * 60 // OTP will be valid for 5 minutes
  });
  console.log('the otp is:', otp);
  console.log('to the mobile number:', phoneNumber);
  const options = {
    authorization: process.env.APIKEYFAST,
    message: `Your OTP for verification is ${otp} valid upto 5 Min.`,
    numbers: [phoneNumber]
  };
  try {
    const response = await fast2sms.sendMessage(options);
    console.log(response);
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});
app.get('/validate-otp/:otp', (req, res) => {
  const { otp } = req.params; // access the otp value from req.params
  const secret = process.env.SECRET_KEY;
  const isOTPValid = speakeasy.totp.verify({ secret, token: otp, window: 5 * 60 });

  if (isOTPValid) {
    // OTP is valid, perform further actions
    return res.status(200).send({ isValidOTP: true });
  } else {
    // OTP is not valid
    return res.status(400).send({ isValidOTP: false, error: 'Invalid OTP. Please enter a valid OTP.' });
  }
});


// check if user is already registerd with userName, Email, Phone
app.get('/check-existing', async (req, res) => {
  const { username, email, phone } = req.query;

  const userByUsername = await Register.findOne({ username });
  const userByEmail = await Register.findOne({ email });
  const userByPhone = await Register.findOne({ phone });

  const errors = {};
  if (userByUsername) {
    errors.username = 'Username already exists';
  }
  if (userByEmail) {
    errors.email = 'Email already exists';
  }
  if (userByPhone) {
    errors.phone = 'Phone number already exists';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  return res.status(200).json({ message: 'No user found with this username, email, or phone number' });
});




// Handle the payment webhook from Stripe
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.WEBHOOK_KEY);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return res.sendStatus(400);
  }

  const payload = event.data.object;
  const eventType = event.type;

  // Handle the payment_intent.succeeded event
  if (eventType === 'payment_intent.succeeded') {
    const paymentIntent = payload;
    const paymentMethodId = paymentIntent.payment_method;
    const amount = paymentIntent.amount;
    const currency = paymentIntent.currency;

    try {
      // Find the user and save the payment data
      const user = await Register.findOne({ 'bankDetails.paymentMethodId': paymentMethodId });

      if (!user) {
        console.error('User not found.');
        return res.status(404).send({ error: 'User not found.' });
      }

      const payment = {
        amount,
        currency,
        paymentId: paymentIntent.id,
      };

      // Save the payment data to the user's payments array
      user.payments.push(payment);
      await user.save();

      console.log('Payment saved successfully.');
      return res.sendStatus(200);
    } catch (err) {
      console.error('Error saving payment:', err);
      return res.status(500).send({ error: 'An error occurred while processing the payment.' });
    }
  } else {
    console.log('Ignoring event type:', eventType);
    return res.sendStatus(200);
  }
});




// Withdraw Router
app.post('/withdraw', async (req, res) => {
  try {
    const { bankName, accountNumber, amount } = req.body;
    const user = await Register.findById(req.user._id);
    const bank = await Bank.findOne({ name: bankName });
    if (!bank) {
      return res.status(400).json({ message: "Bank not found" });
    }
    if (user.coins < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    // Deduct amount from user's coins
    user.coins -= amount;
    await user.save();
    // Update bank's balance
    bank.balance += amount;
    await bank.save();
    return res.json({ message: "Withdrawal successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// checkreferralcode
app.get('/check-referral-code/:referralCode', async (req, res) => {
  const referralCode = req.params.referralCode;

  const referrer = await Register.findOne({ referralCode: referralCode });

  if (referrer) {
    res.status(200).json({ isValidReferralCode: true });
  } else {
    res.status(400).json({ isValidReferralCode: false, message: 'Invalid referral code' });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});