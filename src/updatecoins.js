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
    const minusTeen = 10;
    sponsorUser.coins += 20 - 10;
    await Register.updateOne({ referralCode: referredBy }, { $set: { coins: sponsorUser.coins } });




// Check if referred user has referred other users
const referredUserReferralCodes = referredUsers.map(referral => referral.referralCode);
const referralSponsors = await Register.find({ referralCode: { $in: referredUserReferralCodes } });
const referredUserReferrals = referralSponsors.length;

if (referredUserReferrals > 0) {
  // Update referral sponsors' coins and direct referred users
  referralSponsors.forEach(async (sponsor) => {
    sponsor.coins += 10;
    sponsor.directReferredUsers += 1; // increment direct referred users
    await Register.updateOne({ referralCode: sponsor.referralCode }, { $set: { coins: sponsor.coins, directReferredUsers: sponsor.directReferredUsers } });
  });

 // Update indirect referred user count of sponsor
 const sponsorReferralCode = sponsorUser.referralCode;
 const grandSponsor = await Register.findOne({ referralCode: sponsorUser.referredBy });
 if (grandSponsor) {
   grandSponsor.indirectReferredUsers += 1; // increment indirect referred users
   await Register.updateOne({ referralCode: sponsorUser.referredBy }, { $set: { indirectReferredUsers: grandSponsor.indirectReferredUsers } });
 }

 // Update indirect referred user count of referral sponsors
 referralSponsors.forEach(async (sponsor) => {
   const sponsorReferralCode = sponsor.referralCode;
   const grandSponsor = await Register.findOne({ referralCode: sponsor.referredBy });
   if (grandSponsor) {
     grandSponsor.indirectReferredUsers += 1; // increment indirect referred users
     await Register.updateOne({ referralCode: sponsor.referredBy }, { $set: { indirectReferredUsers: grandSponsor.indirectReferredUsers } });
   }
 });
} else {
 // If referred user does not have any direct referred users, update the direct referred user of the user who referred them
 sponsorUser.directReferredUsers += 1;
 await Register.updateOne({ referralCode: referredBy }, { $set: { directReferredUsers: sponsorUser.directReferredUsers } });
 
 // Update indirect referred user count of sponsor
 const sponsorReferralCode = sponsorUser.referralCode;
 const grandSponsor = await Register.findOne({ referralCode: sponsorUser.referredBy });
 if (grandSponsor) {
   grandSponsor.indirectReferredUsers += 1; // increment indirect referred users
   await Register.updateOne({ referralCode: sponsorUser.referredBy }, { $set: { indirectReferredUsers: grandSponsor.indirectReferredUsers } });
 }
}


    return "Referral handled successfully";
  } catch (error) {
    console.error(error);
    return "An error occurred while handling referral";
  }
};





module.exports = handleReferral;
