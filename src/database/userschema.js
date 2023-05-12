const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const paymentSchema = new mongoose.Schema({
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    paymentId: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

const userschema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: Number,
        required: true,
        unique: true
    },
    otp: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    confirmpassword: {
        type: String,
        required: true
    },
    referralCode: {
        type: String,
        required: true,
        unique: true,
        default: () => Math.random().toString(36).substr(2, 7).toUpperCase()
    },
    sponsorId: {
        type: String,
        unique: true,
        default: () => Math.random().toString(36).substr(2, 7).toUpperCase()
    },
    coins: {
        type: Number,
        default: 0
    },
    referredBy: {
        type: String
    },
    referralChain: [String],
    referredUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register'
      }],
      directReferredUsers: {
        type: Number,
        default: 0
      },
      indirectReferredUsers: {
        type: Number,
        default: 0
      },
    createdAt: {
        type: Date,
        default: Date.now
    },
    payments: [paymentSchema], // Use the defined paymentSchema for payments array
    bankDetails: {
      bankName: { type: String, default: null },
      accountNumber: { type: String, default: null },
      ifscCode: { type: String, default: null },
      panCard: { type: String, default: null },
      aadharCard: { type: String, default: null },
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});


userschema.methods.getTotalReferredUsers = async function () {
    const count = await User.countDocuments({ referralCode: this.referralCode });
    return count;
  };

// generate jwt-tokens 
userschema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token });
        await this.save();
        return token;
    } catch (error) {
        throw new Error("Error generating auth token: " + error);
    }
}

// convert password into hash 
userschema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
        this.confirmpassword = await bcrypt.hash(this.password, 10);
    }
});


// create collection :-

const Register = new mongoose.model("Register", userschema);
module.exports = Register;