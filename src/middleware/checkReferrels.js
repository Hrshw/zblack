const Register = require("../database/userschema");

const validateReferralCode = async (req, res, next) => {
    const referralCode = req.body.referralCode;
  
    if (referralCode) {
        const referrer = await Register.findOne({ referralCode: referralCode });
  
        if (!referrer) {
            res.status(400).json({ isValid: false });
        } else {
            req.referrer = referrer;
            next();
        }
    } else {
        next();
    }
};

module.exports = { validateReferralCode };
