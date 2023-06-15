require('dotenv').config({ path: '../.env' });
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
// const axios = require('axios');
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { registerPartials } = require("hbs");
const bodyParser = require('body-parser');
// const helpers = require('./middleware/helpers');
const auth = require("./middleware/auth");
const { validationResult } = require('express-validator');
const shortid = require('shortid');
const { userRegistrationValidator } = require('./middleware/validate');
const { validateReferralCode } = require('./middleware/checkReferrels');
const handleReferral = require('./controllers/updatecoins');
const { updateBankDetails } = require('./controllers/bankdetails');
// const {sendMail} = require('./controllers/forgotPasswordCont');
const { checkPaymentStatus } = require('./middleware/checkPaymentStatus')
// const sendPasswordResetSMS = require('./controllers/sendPasswordreset')
// const sendinblue = require('sendinblue-api');
const session = require('express-session');
var MemoryStore = require('memorystore')(session)
const fast2sms = require('fast-two-sms');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const speakeasy = require('speakeasy');
const cors = require('cors');
const jwt = require("jsonwebtoken");



app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  saveUninitialized: false
}));


// Add a function to delete expired tokens
async function deleteExpiredTokens(user) {
  const currentDate = new Date();
  const updatedTokens = user.tokens.filter((token) => {
    const tokenExpirationDate = jwt.decode(token.token).exp * 1000;
    return tokenExpirationDate > currentDate;
  });

  user.tokens = updatedTokens;
  await user.save();
}

// database related code
require("./database/conn");
const Register = require("./database/userschema");
const { error } = require('console');

const port = process.env.PORT || 3000;

const staticpath = path.join(__dirname, "../public");
const templetespath = path.join(__dirname, "templates/views");

const partialspath = path.join(__dirname, "templates/partials");

// Enable CORS for all routes
app.use(cors());


// Set the storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads'; // Specify the destination directory

    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename for the uploaded file
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });



app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
const urlencoded = bodyParser.urlencoded({ extended: false });

// middlewares
app.use('/css', express.static(path.join(__dirname, "../node_modules/bootstrap/dist/css")));
app.use('/js', express.static(path.join(__dirname, "../node_modules/bootstrap/dist/js")));
app.use('/js', express.static(path.join(__dirname, "../node_modules/bootstrap/dist/bundle.min.js")));
app.use('/jq', express.static(path.join(__dirname, "../node_modules/jquery/dist")));
app.use('/js', express.static(path.join(__dirname, "../node_modules/validate.js")));
app.use('/webhook', bodyParser.raw({ type: 'application/json' }))
app.use(express.static(staticpath));
app.set("view engine", "hbs");
app.set("views", templetespath);
hbs.registerPartials(partialspath);

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.get('/forgotpassword', (req, res) => {
  res.render('forgotpassword');
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



app.get('/user', auth, checkPaymentStatus, async (req, res) => {
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

    let paymentAmount;
    if (user.paymentMade) {
      paymentAmount = user.paymentAmount;
    }
    // Delete expired tokens
    await deleteExpiredTokens(user);

    res.render('user', { user, userCount, directCoins, indirectCoins, userLoggedIn, paymentAmount });
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


// QR Code process
app.post('/process-payment', upload.single('screenshot'), (req, res) => {
  const paymentAmount = req.body.paymentAmount;
  const screenshotPath = req.file.path;
  const userName = req.body.userName;
  const userId = req.session.userId;

  Register.findByIdAndUpdate(
    userId,
    {
      paymentAmount: paymentAmount,
      'qrCodeDetails.paymentMade': true,
      'qrCodeDetails.userName': userName,
      'qrCodeDetails.screenshot': screenshotPath,
      paymentMade: true
    },
    { new: true }
  )
    .then(user => {
      if (!user) {
        throw new Error('User not found');
      }
      res.json({ message: 'Data submitted successfully', userLink: '/user' });
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Error occurred while processing payment' });
    });
});





// Generate and send OTP to user's phone number
app.post('/sendotp', async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const otp = speakeasy.totp({
    secret: process.env.SECRET_KEY,
    digits: 6,
    window: 5 * 60 // OTP will be valid for 5 minutes
  });
  const options = {
    authorization: process.env.APIKEYFAST,
    message: `Your OTP for verification is ${otp} valid upto 5 Min.`,
    numbers: [phoneNumber]
  };
  try {
    const response = await fast2sms.sendMessage(options);
    res.status(200).json({ success: true });
  } catch (error) {
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


app.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Register.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const secret = process.env.SECRET_KEY + user.password;
    const token = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "15m",
    });
    const link = `https://zblack.in/resetpassword/${user._id}/${token}`;

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: 'codesmith62@gmail.com',
        pass: 'acbwyzyxudwykexn'
      },
    });

    var mailOptions = {
      from: "zblack9521@gmail.com",
      to: user.email,
      subject: "Password Reset Request",
      text: "Click the link below to reset your password: " + link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        // console.log(error);
        return res.status(500).json({ error: "Failed to send email" });
      } else {
        // console.log("Email sent: " + info.response);
        res.json({ message: "Email sent successfully" });
      }
    });
    // console.log(link);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.get("/resetpassword/:userId/:token", (req, res) => {
  res.render("resetpassword", {
    bootstrapCSS: "/css/bootstrap.min.css",
    bootstrapJS: "/js/bootstrap.min.js",
    jquery: "/jq/jquery.min.js",
    customCSS: "../css/style.css",
    backgroundImage: "/images/resetpassword-bg.jpg",
  });
});


app.post("/resetpassword/:userId/:token", async (req, res) => {
  const { userId, token } = req.params;
  const { newPassword } = req.body;

  try {
    // console.log("User ID:", userId);
    // console.log("Token:", token);

    const user = await Register.findById(userId);
    // console.log("User:", user);

    if (!user) {
      // console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const secret = process.env.SECRET_KEY + user.password;
    // console.log("Secret:", secret);

    try {
      const payload = jwt.verify(token, secret);
      // console.log("Payload:", payload);

      // Token is valid, update the user's password
      user.password = newPassword;
      await user.save();

      console.log("Password reset successful");
      return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      // console.log("Invalid token");
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    // console.log("Server error:", error);
    return res.status(500).json({ error: "Server error" });
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




// Create a checkout session
app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'Widget',
          },
          unit_amount: 20000, // Amount in smallest currency unit (200 INR)
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'http://localhost:3000/success.html',
    cancel_url: 'http://localhost:3000/cancel.html',
  });

  res.json({ id: session.id });
});


app.use(bodyParser.raw({ type: 'application/json' }));

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.WEBHOOK_KEY);
  } catch (err) {
    console.error(err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userEmail = session.customer_details.email; // Retrieve the email from the session
    const amount = session.amount_total / 100;

    try {
      const user = await Register.findOne({ email: userEmail });

      if (!user) {
        console.error('User not found');
        return res.status(404).send('User not found');
      }

      // Store the payment amount in the user's schema
      user.paymentAmount = amount;
      user.paymentMade = true;
      await user.save();

      console.log('Payment saved for user:', user);
    } catch (error) {
      console.error('Failed to save payment:', error);
      return res.status(500).send('Failed to save payment');
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    // Handle payment_intent.payment_failed event

    const paymentIntent = event.data.object;
    const userEmail = session.customer_details.email;

    try {
      const user = await Register.findOne({ email: userEmail });

      if (!user) {
        console.error('User not found');
        return res.status(404).send('User not found');
      }

      // Update user's paymentMade flag to false
      user.paymentMade = false;
      await user.save();

      console.log('Payment failed for user:', user);
    } catch (error) {
      console.error('Failed to update payment:', error);
      return res.status(500).send('Failed to update payment');
    }
  }

  res.status(200).send();
});






// Withdraw Router
// app.post('/withdraw', async (req, res) => {
//   try {
//     const { bankName, accountNumber, amount } = req.body;
//     const user = await Register.findById(req.user._id);
//     const bank = await Bank.findOne({ name: bankName });
//     if (!bank) {
//       return res.status(400).json({ message: "Bank not found" });
//     }
//     if (user.coins < amount) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }
//     // Deduct amount from user's coins
//     user.coins -= amount;
//     await user.save();
//     // Update bank's balance
//     bank.balance += amount;
//     await bank.save();
//     return res.json({ message: "Withdrawal successful" });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

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