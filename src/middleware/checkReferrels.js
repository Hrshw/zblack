const Register = require("../database/userschema");

const validateReferralCode = async (req, res, next) => {
    const referralCode = req.body.referralCode;

    if (referralCode) {
        const referrer = await Register.findOne({ referralCode: referralCode });

        if (!referrer) {
            req.isValidReferralCode = false;
            req.referralCodeErrorMessage = 'Invalid referral code';
        } else {
            req.isValidReferralCode = true;
            req.referrer = referrer;
        }
    } else {
        req.isValidReferralCode = true;
    }

    next();
};

module.exports = { validateReferralCode };
