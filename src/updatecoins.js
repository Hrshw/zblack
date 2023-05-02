const Register = require('./database/userschema');




const handleReferral = async (referralCode, referredBy) => {
  try {
    const referredUser = await Register.findOne({ referralCode });
    const sponsorUser = await Register.findOne({ referralCode: referredBy });

    // If the referred user does not exist, return an error message
    if (!referredUser) {
      return "Referred user does not exist";
    }

    // If the sponsor user does not exist, return an error message
    if (!sponsorUser) {
      return "Sponsor user does not exist";
    }

    // Check if the sponsor user has reached their referral limit
    if (sponsorUser.directReferredUsers.length + sponsorUser.indirectReferredUsers.length >= 1024) {
      return "You have already reached the maximum limit of referred users";
    }

    // Update referred user's referral chain
    const referralChain = referredUser.referralChain;
    referralChain.push(sponsorUser.referralCode);
    await Register.updateOne({ referralCode }, { $set: { referralChain } });

    // Update sponsor user's referred users
    const referredUsers = sponsorUser.referredUsers;
    referredUsers.push(referredUser._id);
    await Register.updateOne({ referralCode: referredBy }, { $set: { referredUsers } });

    // Update sponsor user's coins
    sponsorUser.coins += 15;
    await Register.updateOne({ referralCode: referredBy }, { $set: { coins: sponsorUser.coins } });

    // Update referred user's direct referred users

    referredUser.directReferredUsers = referredUsers.length;
    await Register.updateOne({ referralCode }, { $set: { directReferredUsers: referredUser.directReferredUsers } });
  
    // Check if referred user has referred other users
    const referredUserReferralCodes = referredUsers.map(referral => referral.referralCode);
    const referralSponsors = await Register.find({ referralCode: { $in: referredUserReferralCodes } });
    const referredUserReferrals = referralSponsors.length;

    if (referredUserReferrals > 0) {
      // Update referral sponsors' coins
      referralSponsors.forEach(async (sponsor) => {
        sponsor.coins += 5;
        await Register.updateOne({ referralCode: sponsor.referralCode }, { $set: { coins: sponsor.coins } });
      });

      // Update referred user's sponsor coins and indirect referred users
      sponsorUser.coins += 5 * referredUserReferrals;
      await Register.updateOne({ referralCode: referredBy }, { $set: { coins: sponsorUser.coins } });
      referredUser.indirectReferredUsers = referredUserReferrals;
      await Register.updateOne({ referralCode }, { $set: { indirectReferredUsers: referredUser.indirectReferredUsers } });
    }

    return "Referral handled successfully";
  } catch (error) {
    console.error(error);
    return "An error occurred while handling referral";
  }
};





module.exports = handleReferral;
