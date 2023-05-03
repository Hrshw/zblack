require('dotenv').config({path:'../.env'});
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
const handleReferral = require('./updatecoins');
const session = require('express-session');
const fast2sms = require('fast-two-sms');
const otplib = require('otplib');
const secret = otplib.authenticator.generateSecret();
const cors = require('cors')


app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));

// database related code
require("./database/conn");
const Register = require("./database/userschema");
const { time } = require('console');

const port = process.env.PORT || 3000;

const staticpath = path.join(__dirname, "../public");
console.log(staticpath);
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

app.post('/logout', async (req, res) => {
  try {
    // Remove the user's token from the tokens array
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    // Save the updated user document
    await req.user.save();

    // Clear the cookie
    res.clearCookie('jwt');

    res.redirect('/login');
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});

app.get('/user', auth, async (req, res) => {
  try {
    const user = await Register.findById(req.session.userId); // get the user data from the session
    console.log(user);
    if (!user) {
      return res.redirect('/login');
    }
    const userCount = await getUserCount();
    res.render('user', { user, userCount  }); // render the user template and pass user data
    

  } catch (error) {
    console.log(error);
    res.redirect('/login');
  }
});

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

  const { username, email, phone, otp, password, confirmpassword, referredUsers} = req.body;
 
  // Verify OTP
 const isOTPValid = otplib.authenticator.check(otp, secret);
 if (!isOTPValid) {
   return res.render('signup', { alert: [{ msg: 'Invalid OTP. Please enter a valid OTP.' }] });
 }
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

const stripe = require('stripe')(process.env.KEY);


app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  // Calculate the total amount
  const amount = 200;

  // Create a PaymentIntent with the specified amount
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "inr",
    payment_method_types: ["card"],
    metadata: {
      integration_check: "accept_a_payment",
      items: JSON.stringify(items),
    },
  });

  // Return the client secret to the client-side
  res.json({ clientSecret: paymentIntent.client_secret });
});


app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const email = paymentIntent.metadata.email;
    const amount = paymentIntent.amount;
    const currency = paymentIntent.currency;
    const paymentId = paymentIntent.id;

    try {
      // Update the user's document with the payment details
      const user = await Register.findOneAndUpdate({email}, {payment: {amount, currency, paymentId}, paymentStatus: 'success'}, {new: true});
      console.log(`user ${email} updated with payment details`);
    } catch (err) {
      console.error(`Error updating user ${email}: ${err}`);
    }
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
});



// Generate and send OTP to user's phone number
app.post('/sendotp', async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const validtime = 300
  const otp = otplib.authenticator.generate(secret,  validtime);
console.log('the otp is :', otp)
console.log('to the mobile number', phoneNumber);
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

// verifyotp
// app.post('/verifyotp', (req, res) => {
//   const { phoneNumber, otp } = req.body;

//   console.log('phoneNumber:', phoneNumber);
//   console.log('otp:', otp);

//   if (!phoneNumber || !otp) {
//     res.status(400).json({ success: false, message: 'Invalid request' });
//     return;
//   }

//   console.log(`phoneNumber: ${phoneNumber}`);
//   console.log(`otp: ${otp}`);

//   const isValid = otplib.authenticator.check(otp, secret);

//   if (isValid) {
//     res.status(200).json({ success: true });
//   } else {
//     res.status(401).json({ success: false, message: 'Invalid OTP' });
//   }
//   console.log(`isValid: ${isValid}`);

// });



// Start server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
