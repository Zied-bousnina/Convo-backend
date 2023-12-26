const asyncHandler = require('express-async-handler')
const generateToken = require('../utils/generateToken.js')
const User = require('../models/userModel.js')
var crypto = require('crypto');
var mailer = require('../utils/mailer');
const validateRegisterInput = require('../validations/validateRegisterInput')
const PartnerValidationInput = require('../validations/PartnerInputValidation.js')
const DriverValidationInput = require('../validations/DriverInputValidation.js')
const validateDemandeInput = require('../validations/DemandeValidation.js')
const validateFeedbackInput = require('../validations/FeedbackValidation')
const validateLoginInput = require('../validations/login')
const changePasswordValidation = require('../validations/ChangePasswordValidation.js')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verificationTokenModels = require("../models/verificationToken.models");
const { generateOTP,generateRandomPassword, mailTransport, generateEmailTemplate,generateDeleteAccountEmailTemplate,generateEmailTemplateDriver,generateEmailTemplatePartner,generateEmailTemplateAffectation, plainEmailTemplate, generatePasswordResetTemplate, generateEmailTemplateDeleterAccount } = require("../utils/mail");
const { isValidObjectId } = require('mongoose');
const { sendError, createRandomBytes } = require("../utils/helper");
const resetTokenModels = require("../models/resetToken.models");
const demandeModels = require("../models/Demande.model");
const DriverDocuments = require("../models/driverDocuments.model.js");
const imageToBase64 = require("image-to-base64");
const multer = require('multer')
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const { OAuth2Client } = require('google-auth-library');
const profileModels = require("../models/profile.models")
const FeedbackModel = require('../models/Feedback.Model.js');
const cloudinary = require('../utils/uploadImage');
const DemandeModel = require('../models/Demande.model');




const createDemande = async (req, res) => {
  // const userId = req.body.userId; // Assuming userId is provided in the request body
  console.log(req.body)
  const { errors, isValid } = validateDemandeInput(req.body);
  try {
    if (isValid) {
      const { address, destination, offer,comment, postalAddress, postalDestination, distance,dateDepart,driverIsAuto,driver } = req.body;
    // Create a new demand object
    const newDemande = new demandeModels({
      user: req.user.id,
      address,
      destination,
      comment,
      postalAddress,
      postalDestination,
      offer,
      distance,
      dateDepart,
      driverIsAuto,
      driver
    });

    // Save the new demand
    const createdDemande = await newDemande.save();
     // Check if driver attribute is not null
     if (driver) {
      // Find the user with the specified driver ID
      const driverUser = await User.findById(driver);

      // Send an email to the driverUser (you need to implement this function)
      // For example, you can use a hypothetical sendEmail function
      mailer.send({
        to: ["zbousnina@yahoo.com", driverUser.email],
        subject: "Convoyage Mission Affectation Notification",
        html: generateEmailTemplateAffectation(driverUser.name, newDemande),
      }, (err) => {});

      // You may also want to handle errors or log the result of sending the email
    }

    res.status(201).json({ message: 'Demande created successfully', demande: createdDemande });
  } else {
    responseSent = true;
    return res.status(404).json(errors);
  }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteDemande = async (req, res) => {
  const demandId = req.params.demandId; // Assuming demandId is provided as a route parameter

  try {
    // Check if the demand exists
    const existingDemande = await demandeModels.findById(demandId);

    if (!existingDemande) {
      return res.status(404).json({ message: 'Demande not found' });
    }

    // Check if the user making the request is the owner of the demand
    if (existingDemande.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Delete the demand
    await existingDemande.remove();

    res.status(200).json({ message: 'Demande deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const findDemandsByUserId = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id

  try {
    const demands = await demandeModels.find({ user: userId });

    if (demands.length > 0) {
      res.status(200).json({ demands });
    } else {
      res.status(404).json({ message: 'No demands found for the user.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
const findDemandsCreatedByPartner = async (req, res) => {
  try {
    // Fetch all demands
    const allDemands = await demandeModels.find({})
      .populate('user') // Populate the 'user' field to get user details
      .exec();

    // Filter demands created by users with the role 'partner'
    const partnerDemands = allDemands.filter(demand => demand.user.role === 'PARTNER');

    res.status(200).json({ demands: partnerDemands });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
const findDemandById = async (req, res) => {
  const demandId = req.params.demandId// Assuming user ID is available in req.user.id

  try {
    const demande = await demandeModels.findById(demandId).populate('driver');


      res.status(200).json({ demande });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
const incrementOffer = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id
  const demandId = req.params.demandId; // Assuming you pass the demandId in the request parameters

  try {
    // Find the demand by ID and user ID
    const demand = await demandeModels.findOne({ _id: demandId, user: userId });

    if (!demand) {
      return res.status(404).json({ message: 'Demand not found for the user.' });
    }

    // Increment or decrement the offer by 0.5
    demand.offer = (parseFloat(demand.offer) + 0.5).toString();

    // Save the updated demand
    const updatedDemand = await demand.save();

    res.status(200).json({ message: 'Offer updated successfully', demand: updatedDemand });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
const decreaseOffer = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id
  const demandId = req.params.demandId; // Assuming you pass the demandId in the request parameters

  try {
    // Find the demand by ID and user ID
    const demand = await demandeModels.findOne({ _id: demandId, user: userId });

    if (!demand) {
      return res.status(404).json({ message: 'Demand not found for the user.' });
    }

    // Increment or decrement the offer by 0.5
    demand.offer = (parseFloat(demand.offer) - 0.5).toString();

    // Save the updated demand
    const updatedDemand = await demand.save();

    res.status(200).json({ message: 'Offer updated successfully', demand: updatedDemand });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
const addAddress = async (req, res) => {
  try {
    const {  address } = req.body; // Assuming you send userId and newAddress in the request body

    // Find the user by userId
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Call the addAddress method to update the user's address
    const u =await user.addAddress(address);

    res.json({ message: 'Address updated successfully.', user:u });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const SetUserStatus = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle the online status
    user.onligne = req.body.onligne;

    // Save the updated user
    await user.save();

    // Respond with the updated user object or just a success message
    res.status(200).json({ message: 'User status updated successfully', user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
let responseSent = false;

// let responseSent = false;
const authUser = async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  try {
    if (isValid) {
      const user = await User.findOne({ email: req.body.email });
      if (user && user.googleId) {
        errors.email = "Cannot login with email and password. Please use Google Sign In.";
        responseSent = true;
                return res.status(400).json(errors);
              }

      console.log(user)
      if (!user) {
        errors.email = "Email not found";
        responseSent = true;
        return res.status(404).json(errors);
      }
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (isMatch) {
        const token = jwt.sign(
          {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            verified:user.verified,
            profile: user.profile,
            isBlocked:user.isBlocked,
            onligne:user.onligne,
            firstLogin:user.firstLogin,
            driverIsVerified:user.driverIsVerified

          },
          process.env.SECRET_KEY,
          { expiresIn: Number.MAX_SAFE_INTEGER }
        );
        responseSent = true;
        return res.header("auth-token", token).status(200).json({ status: true, token: "Bearer " + token });
      } else {
        errors.password = "Password incorrect";
        responseSent = true;
        return res.status(404).json(errors);
      }
    } else {
      responseSent = true;
      return res.status(404).json(errors);
    }
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.log(error);
      console.log("hi")
      return res.status(500).json({success:false, message: "error" });
    }
  }

}
const updatePassword = async (req, res) => {
  let responseSent = false;
  const { errors, isValid } = changePasswordValidation(req.body);

  try {
    // Check validation
    if (!isValid) {
      responseSent = true;
      return res.status(404).json(errors);
    }

    // Find user by req.user.id
    const user = await User.findById(req.user.id);

    if (!user) {
      errors.email = "User not found";
      responseSent = true;
      return res.status(404).json(errors);
    }

    // Check if new password and confirm match
    if (req.body.newPassword !== req.body.confirm) {
      errors.confirm = "Password and confirm password do not match";
      responseSent = true;
      return res.status(400).json(errors);
    }

    // Update password and set firstLogin to false
    const newPassword = bcrypt.hashSync((req.body.newPassword).trim(), 10);
    user.password = newPassword;
    user.firstLogin = false;

    await user.save();
    responseSent = true;
    return res.status(200).json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.log(error);
      return res.status(500).json({ success: false, message: "error" });
    }
  }
};








// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  console.log(req.body)
  const { errors, isValid } = validateRegisterInput(req.body)
  const {avatar} = req.body;

  console.log(avatar)

  try {
    if (!isValid) {
      res.status(404).json(errors);
    } else {
      User.findOne({ email: req.body.email })
        .then(async exist => {
          if (exist) {
            res.status(404).json({success:false, email: "Email already exist" })
          } else {
            // req.body.role = "USER"
            const user = new User({
              name: req.body.name,
              email: req.body.email,
              password: bcrypt.hashSync(req.body.password, 10),
              role: "DRIVER",


            })

            const OTP = generateOTP()
            const verificationToken = new verificationTokenModels({
              owner: user._id,
              token: OTP
            })
            await verificationToken.save()
              .then(token => {
                console.log(token)
              })
              .catch(err => {
                console.log(err)
              })

            mailer.send({
              to: ["zbousnina@yahoo.com",user.email ],
              subject: "Verification code",
              html: generateEmailTemplate(OTP)
            }, (err)=>{
              console.log(err)
            })

            user.save()
              .then(user => {
                if(req.body.role==="MUNICIPAL" || req.body.role=== "PRIVATE_COMPANY"){
                  console.log("municipal")
                  const token = jwt.sign(
                    {
                      id: user._id,

                      email: user.email,
                      role: user.role,


                    },
                    process.env.SECRET_KEY,
                    { expiresIn: Number.MAX_SAFE_INTEGER }
                  );
                  responseSent = true;
                  return res.header("auth-token", token).status(200).json({ status: true, token: "Bearer " + token });
                }else{

                  res.status(200).json({ success: true,user, msg: 'A Otp has been sent to your registered email address.'} )
                }
              })
              .catch(err => {
                console.log(err)
                res.status(500).json({ success:false, message: "error" })
              })

          }
        })
    }



  } catch (error) {
    res.status(500).json({ message: error })
    console.log(error)

  }
})

const AddPartner = asyncHandler(async (req, res, next) => {
  const { errors, isValid } = PartnerValidationInput(req.body);
  const { kbis } = req.files;
  console.log(kbis);

  try {
    if (!isValid) {
      return res.status(404).json(errors);
    }

    let responseSent = false;

    // Check if email already exists
    const existingEmailUser = await User.findOne({ email: req.body.email });
    if (existingEmailUser) {
      errors.email = "Email already exists";
      responseSent = true;
      return res.status(404).json(errors);
    }

    // Check if siret number already exists
    const existingSiretUser = await User.findOne({ siret: req.body.siret });
    if (existingSiretUser) {
      errors.siret = 'This SIREN/SIRET already exists';
      responseSent = true;
      return res.status(404).json(errors);
    }

    // Check if phone number already exists
    const existingPhoneNumberUser = await User.findOne({ phoneNumber: req.body.phoneNumber });
    if (existingPhoneNumberUser) {
      errors.phoneNumber = 'Phone number already exists';
      responseSent = true;
      return res.status(404).json(errors);
    }

    if (!responseSent) {
      if (kbis) {
        const result = await cloudinary.uploader.upload(kbis.path, {
          resource_type: 'auto',
          folder: 'pdf_uploads',
          public_id: `kbis_${Date.now()}`,
          overwrite: true,
        });
        console.log(result);
        req.body.kbis = result.secure_url;
      }

      const GeneratedPassword = generateRandomPassword();
      const user = new User({
        name: req.body.name,
        addressPartner: req.body.addressPartner,
        contactName: req.body.contactName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: bcrypt.hashSync(GeneratedPassword, 10),
        role: "PARTNER",
        verified: true,
        siret: req.body.siret,
        kbis: req.body.kbis,
        firstLogin:true
      });

      mailer.send({
        to: ["zbousnina@yahoo.com", user.email],
        subject: "Welcome to Convoyage! Your Account Details Inside",
        html: generateEmailTemplatePartner(user.contactName, user.name, user.email, GeneratedPassword),
      }, (err) => {});

      user.save()
        .then(savedUser => {
          res.status(200).json({ success: true, user: savedUser, msg: 'An email has been sent to your registered email address.' });
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ success: false, message: "Error" });
        });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});



const updatePartner = asyncHandler(async (req, res, next) => {
  const { errors, isValid } = PartnerValidationInput(req.body);

  try {

      const partnerId = req.params.id;
      const newEmail = req.body.email;

      // Check if the new email already exists in another account
      const emailExistsInOtherAccount = await User.findOne({ email: newEmail, _id: { $ne: partnerId } });

      if (emailExistsInOtherAccount) {
        res.status(400).json({ success: false, message: "The new email already exists in another account." });
        return;
      }

      const existingPartner = await User.findById(partnerId);

      if (!existingPartner) {
        res.status(404).json({ success: false, message: "Partner not found." });
      } else {
        // Generate a new password
        const newGeneratedPassword = generateRandomPassword();

        // Update partner fields
        existingPartner.name = req.body.name || existingPartner.name;
        existingPartner.addressPartner = req.body.addressPartner ||existingPartner.addressPartner ;
        existingPartner.contactName = req.body.contactName || existingPartner.contactName;
        existingPartner.email = newEmail || existingPartner.email ; // Update with the new email
        existingPartner.phoneNumber = req.body.phoneNumber || existingPartner.phoneNumber;
        existingPartner.password = bcrypt.hashSync(newGeneratedPassword, 10);

        // Save the updated partner if the new email is unique
        const updatedPartner = await existingPartner.save();

        // Send an email with the new password
        mailer.send({
          to: ["zbousnina@yahoo.com", updatedPartner.email],
          subject: "Convoyage: Your Account Information has been Updated",
          html: generateEmailTemplatePartner(updatedPartner.contactName, updatedPartner.name, updatedPartner.email, newGeneratedPassword),
        }, (err) => {
          if (err) {
            console.error(err); // Log the error for debugging
          }
        });

        res.status(200).json({ success: true, partner: updatedPartner, msg: 'Partner updated successfully. A new email has been sent with your updated account information.' });
      }

  } catch (error) {
    res.status(500).json({ message: error });
  }
});

const updateMission = asyncHandler(async (req, res, next) => {
  try {
    const missionId = req.params.id;
    const existingMission = await DemandeModel.findById(missionId);

    if (!existingMission) {
      return res.status(404).json({ success: false, message: "Mission not found." });
    }

    // Update Mission fields with values from the request body
    Object.keys(req.body).forEach((key) => {
      if (key !== 'dateDepart') { // exclude 'dateDepart' for special handling
        // Update the field only if the value is not empty
        if (req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '') {
          existingMission[key] = req.body[key];
        }
      } else {
        // Handle 'dateDepart' separately
        existingMission.dateDepart = req.body.dateDepart ? new Date(req.body.dateDepart) : existingMission.dateDepart;
      }
    });

    // Save the updated Mission
    const updatedMission = await existingMission.save();

    res.status(200).json({
      success: true,
      mission: updatedMission,
      msg: 'Mission updated successfully.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
});



// module.exports = updatePartner;









// @desc    Register a new user
// @route   POST /api/users/resendotp
// @access  Public
const resendOTP = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({success:false, error: "Email not found" });
    } else if(user.verified){
      return res.status(404).json({success:false, error: "Email already verified" });
    } else {
      const OTP = generateOTP();

      // Find and delete existing verification token for the user
      await verificationTokenModels.findOneAndDelete({ owner: user._id });

      const verificationToken = new verificationTokenModels({
        owner: user._id,
        token: OTP,
      });
      await verificationToken.save();
      mailer.send(
        {
          to: ["zbousnina@yahoo.com", user.email],
          subject: "Verification code",
          html: generateEmailTemplate(OTP),
        },
        (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
          }
        }
        );
        res.status(200).json({ OTP: {success:true ,message: "OTP sent" }});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
  }
};
const resendOTPDeleteAccount = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({success:false, error: "Email not found" });
    // } else if(user.verified){
    //   return res.status(404).json({success:false, error: "Email already verified" });
    } else {
      const OTP = generateOTP();

      // Find and delete existing verification token for the user
      await verificationTokenModels.findOneAndDelete({ owner: user._id });

      const verificationToken = new verificationTokenModels({
        owner: user._id,
        token: OTP,
      });
      await verificationToken.save();
      mailer.send(
        {
          to: ["zbousnina@yahoo.com", user.email],
          subject: "Verification code",
          html: generateEmailTemplateDeleterAccount(OTP),
        },
        (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
          }
        }
        );
        res.status(200).json({ OTP: {success:true ,message: "OTP sent" }});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
  }
};

// @desc    Verify user email
// @route   POST /api/users/verifyemail
// @access  Public
const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;
  console.log(userId, otp)
  if (!userId || !otp.trim()) {
    return sendError(res, 'Invalid request, missing parameters!');
  }

  if (!isValidObjectId(userId)) {
    return sendError(res, 'Invalid user id!');
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 'Sorry! User not found!');
  }

  if (user.verified) {
    return sendError(res, 'This account is already verified!');
  }

  const token = await verificationTokenModels.findOne({ owner: user._id });
  if (!token) {
    // return sendError(res, 'Sorry, user not found');
    return sendError(res, 'Please resend OTP');
  }

  const isMatched = await token.compareToken(otp);
  if (!isMatched) {
    return sendError(res, 'Please provide a valid token!');
  }

  user.verified = true;
  await verificationTokenModels.findByIdAndDelete(token._id);
  await user.save();

  mailer.send({
        to: ["zbousnina@yahoo.com",user.email ],
        subject: "Verification code",
        html: plainEmailTemplate("Email Verified Successfully",
        "Your email has been verified successfully!"
      )
      }, (err)=>{
        console.log(err)
      })

  res.status(200).json({success:true, message: "Email verified successfully" });
};

const DeleteAccount = async (req, res) => {
  const { userId, otp } = req.body;
  // console.log(userId, otp)
  console.log(req.body)

  if (!userId || !otp.trim()) {
    return sendError(res, 'Invalid request, missing parameters!');
  }

  if (!isValidObjectId(userId)) {
    return sendError(res, 'Invalid user id!');
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 'Sorry! User not found!');
  }

  const token = await verificationTokenModels.findOne({ owner: user._id });
  if (!token) {
    return sendError(res, 'Please resend OTP');
  }

  const isMatched = await token.compareToken(otp);
  if (!isMatched) {
    // console.log(res.statusCode)
    return sendError(res, 'Please provide a valid token!');
  }

  await verificationTokenModels.findByIdAndDelete(token._id);
  await user.remove();

  mailer.send({
        to: ["zbousnina@yahoo.com", user.email],
        subject: "Account Deleted Successfully",
        html: plainEmailTemplate("Account Deleted Successfully",
        "Your account has been deleted successfully!"
      )
      }, (err)=>{
        console.log(err)
      })

  res.status(200).json({success:true, message: "Account deleted successfully" });
};
const DeleteAccountByAdmin = async (req, res) => {
  const { id } = req.params; // Assuming the user ID is in the URL parameters

  if (!id || !isValidObjectId(id)) {
    return sendError(res, 'Invalid user id!');
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return sendError(res, 'User not found!');
    }

    // You may want to add additional checks or restrictions here if needed

    await user.remove();

    mailer.send({
      to: ["zbousnina@yahoo.com", user.email],
      subject: "Account Deleted by Admin",
      html: generateDeleteAccountEmailTemplate(user.name, user.email)
     }, (err) => {
      if (err) {
        console.error(err);
      }
    });

    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    return sendError(res, 'Error deleting account');
  }
};




// @desc    Forgot password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  console.log(req.body.email)
  const { email } = req.body;
  if (!email) {
    return sendError(res, 'Please provide a valid email!');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, 'Sorry! User not found!');
  }

  const token = await resetTokenModels.findOne({ owner: user._id });
  if (token ) {
    return sendError(res, 'You can request a new token after one hour!');
  }

  const resetToken = await createRandomBytes();
  // const resetTokenExpire = Date.now() + 3600000;

  const newToken = new resetTokenModels({
    owner: user._id,
    token: resetToken


  });

  await newToken.save();

  mailer.send({
    to: ["zbousnina@yahoo.com",user.email ],
    subject: "Verification code",
    html: generatePasswordResetTemplate(`https://reset-password-xgenbox.netlify.app/reset-password?token=${resetToken}&id=${user._id}`)
  }, (err)=>{
    console.log(err)
  })

  res.status(200).json({ message: 'Reset password link has been sent to your email!' });
};


// @desc    Reset password
// @route   POST /api/users/resetpassword
// @access  Public
const resetPassword = async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return sendError(res, 'User not found');
  }

  const isSamePassword = await user.comparePassword(password);
  if (isSamePassword) {
    return sendError(res, 'You cannot use the same password');
  }

  if (password.trim().length < 8 || password.trim().length > 20) {
    return sendError(res, 'Password must be between 8 and 20 characters');
  }

  // user.password = password.trim();
  user.password = bcrypt.hashSync(password.trim(), 10);
  await user.save();

  await resetTokenModels.findOneAndDelete({ owner: user._id });

  mailTransport().sendMail(
    {
      from: 'security@email.com',
      to: user.email,
      subject: 'Reset Password successfully',
      html: plainEmailTemplate('Password reset successfully', 'Your password has been reset successfully!'),
    },
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );
  mailer.send({
    to: ["zbousnina@yahoo.com",user.email ],
    subject: "Verification code",
    html: plainEmailTemplate('Password reset successfully', 'Your password has been reset successfully!'),
  }, (err)=>{
    console.log(err)
  })

  res.status(200).json({ message: 'Password reset successfully', success:true });
};


const getUsers = async (req, res) => {
  // console.log(req.user.id)
  try {
      const basicInfo = await User.find({ onligne: true });
      res.status(200).json({ users:basicInfo})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};
const getUsersById = async (req, res) => {
  // console.log(req.user.id)
  try {
      const basicInfo = await User.findById(req.user.id);
      res.status(200).json({ user:basicInfo})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};
const getAllPartner = async (req, res) => {
  // console.log(req.user.id)
  try {
      const partner = await User.find({ role: "PARTNER" });
      res.status(200).json({ partner})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};
const getAllDriver = async (req, res) => {
  // console.log(req.user.id)
  try {
      const driver = await User.find({ role: "DRIVER" });
      res.status(200).json({ driver})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};
const getPartnerById = async (req, res) => {
  // console.log(req.user.id)
  try {
      const partner = await User.findById(req.params.id);
      res.status(200).json({ partner})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};


// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    await user.remove()
    res.json({ message: 'User removed' })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')

  if (user) {
    res.json(user)
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})
const getAllUserDetailsById = async (req, res) => {
  try {
    const userId = req?.params?.id;
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    // const cleaningServiced = await cleaningModel.find({ user: userId }) || {};
    // const profile = await profileModels.find({ user: userId }).populate('user') || {};
    // const users = await User.findById(userId).populate('accessListBins') || {};

    // res.json({ users, profile, cleaningServiced });
  } catch (error) {
    // Handle the error
    res.status(404).json({ error: 'User not found' });
  }
};


// @desc    Get user by Email
// @route   GET /api/users/:email
// @access  Private/Admin

const getUserByEmail = async (req, res) => {
  const { email } = req.params

  try {
    const user = await User.findOne({ email: email })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email

    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

const blockUser = async(req, res)=>  {
  const { id } = req.params;
  const user = await User.findById(id);
  if (user) {
    user.isBlocked = true;
    await user.save();
    res.json({ message: 'User blocked' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}
const deblockUser = async(req, res)=>  {
  const { id } = req.params;
  const user = await User.findById(id);
  if (user) {
    user.isBlocked = false;
    await user.save();
    res.json({ message: 'User deblocked' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}





const reportUser = async (req, res)=> {
  const { id } = req.params;
  const user = await User.findById(id);
  if (user) {
    user.isReported = true;
    await user.save();
    res.json({ message: 'User reported' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}

const CreateFeedback = async (req, res)=> {
  const { isValid, errors } = validateFeedbackInput(req.body);
  console.log(req.body);



  const {_id} =req.user
  const {feedback} = req.body
  try {
    if (!isValid) {
      res.status(404).json(errors);
    } else {

    const feedbacks = new FeedbackModel({
      user: _id,
      feedback
    })
    const createdFeedback = await feedbacks.save()
    res.status(201).json(createdFeedback)
  }
  } catch (error) {

    res.status(400).json(error)
  }

}


const getUsersCount = async (req, res) => {
  try {
    const currentDate = new Date();
    const lastDayDate = new Date();
    lastDayDate.setDate(currentDate.getDate() - 1);

    const excludeRoles = ['ADMIN', 'PARTNER']; // Add the roles to exclude

    const currentDayCountsByRole = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: lastDayDate, $lt: currentDate },
          role: { $nin: excludeRoles } // Exclude users with roles in excludeRoles array
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCountsByRole = await User.aggregate([
      {
        $match: {
          role: { $nin: excludeRoles } // Exclude users with roles in excludeRoles array
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const currentDayCountTotal = await User.countDocuments({
      createdAt: { $gte: lastDayDate, $lt: currentDate },
      role: { $nin: excludeRoles } // Exclude users with roles in excludeRoles array
    });

    const totalCountTotal = await User.countDocuments({
      role: { $nin: excludeRoles } // Exclude users with roles in excludeRoles array
    });

    const roles = [...new Set([...currentDayCountsByRole.map(item => item._id), ...totalCountsByRole.map(item => item._id)])];

    const percentageIncreaseByRole = roles.map(role => {
      const currentDayCount = currentDayCountsByRole.find(item => item._id === role);
      const totalCount = totalCountsByRole.find(item => item._id === role);
      const percentageIncrease = totalCount ? ((currentDayCount?.count || 0) - totalCount.count) / totalCount.count * 100 : 0;
      return {
        role,
        currentDayCount: currentDayCount?.count || 0,
        totalCount: totalCount?.count || 0,
        percentageIncrease
      };
    });

    const percentageIncreaseTotal = totalCountTotal ? ((currentDayCountTotal - totalCountTotal) / totalCountTotal) * 100 : 0;

    res.json({
      byRole: percentageIncreaseByRole,
      total: {
        currentDayCount: currentDayCountTotal,
        totalCount: totalCountTotal,
        percentageIncrease: percentageIncreaseTotal
      }
    });
  } catch (error) {
    console.error("Error in getUsersCount:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
const getPartnerCount = async (req, res) => {
  try {
    const currentDate = new Date();
    const lastDayDate = new Date();
    lastDayDate.setDate(currentDate.getDate() - 1);

    const excludeRoles = ['ADMIN', 'DRIVER']; // Exclude 'ADMIN' and 'DRIVER' roles

    const currentDayCountsByRole = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: lastDayDate, $lt: currentDate },
          role: { $nin: excludeRoles, $eq: 'PARTNER' } // Exclude 'ADMIN' and 'DRIVER', and include 'PARTNER'
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCountsByRole = await User.aggregate([
      {
        $match: {
          role: { $nin: excludeRoles, $eq: 'PARTNER' } // Exclude 'ADMIN' and 'DRIVER', and include 'PARTNER'
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const currentDayCountTotal = await User.countDocuments({
      createdAt: { $gte: lastDayDate, $lt: currentDate },
      role: { $nin: excludeRoles, $eq: 'PARTNER' } // Exclude 'ADMIN' and 'DRIVER', and include 'PARTNER'
    });

    const totalCountTotal = await User.countDocuments({
      role: { $nin: excludeRoles, $eq: 'PARTNER' } // Exclude 'ADMIN' and 'DRIVER', and include 'PARTNER'
    });

    const roles = [...new Set([...currentDayCountsByRole.map(item => item._id), ...totalCountsByRole.map(item => item._id)])];

    const percentageIncreaseByRole = roles.map(role => {
      const currentDayCount = currentDayCountsByRole.find(item => item._id === role);
      const totalCount = totalCountsByRole.find(item => item._id === role);
      const percentageIncrease = totalCount ? ((currentDayCount?.count || 0) - totalCount.count) / totalCount.count * 100 : 0;
      return {
        role,
        currentDayCount: currentDayCount?.count || 0,
        totalCount: totalCount?.count || 0,
        percentageIncrease
      };
    });

    const percentageIncreaseTotal = totalCountTotal ? ((currentDayCountTotal - totalCountTotal) / totalCountTotal) * 100 : 0;

    res.json({
      byRole: percentageIncreaseByRole,
      total: {
        currentDayCount: currentDayCountTotal,
        totalCount: totalCountTotal,
        percentageIncrease: percentageIncreaseTotal
      }
    });
  } catch (error) {
    console.error("Error in getPartnerStatistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMissionsCountByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if there are any documents in the 'Deamnde' collection with the given user ID
    const missionCount = await demandeModels.countDocuments({ user: userId });

    res.status(200).json({ missionCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const getTotalDemandesCount = async (req, res) => {
  try {
    // Assuming you have a Demande model
    const currentDate = new Date();
    const lastDayDate = new Date();
    lastDayDate.setDate(currentDate.getDate() - 1);

    const currentDayCountTotal = await demandeModels.countDocuments({
      createdAt: { $gte: lastDayDate, $lt: currentDate }
    });

    const totalCountTotal = await demandeModels.countDocuments();

    const percentageIncreaseTotal = totalCountTotal ? ((currentDayCountTotal - totalCountTotal) / totalCountTotal) * 100 : 0;

    res.json({
      total: {
        currentDayCount: currentDayCountTotal,
        totalCount: totalCountTotal,
        percentageIncrease: percentageIncreaseTotal
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// const AddDriver = asyncHandler(async (req, res, next) => {
//   const { errors, isValid } = DriverValidationInput(req.body)
//   try {
//     if (!isValid) {
//       res.status(404).json(errors);
//     } else {
//       User.findOne({ email: req.body.email })
//         .then(async exist => {
//           if (exist) {
//             res.status(404).json({success:false, email: "Email already exist" })
//           } else {
//             // req.body.role = "USER"
//             const GeneratedPassword = generateRandomPassword()
//             const user = new User({
//               name: req.body.name,
//               email: req.body.email,
//               password: bcrypt.hashSync(GeneratedPassword, 10),
//               role: "DRIVER",
//               verified:true
//             })
//             mailer.send({
//               to: ["zbousnina@yahoo.com",user.email ],
//               subject: "Welcome to Convoyage! Your Account Details Inside",
//               html: generateEmailTemplateDriver( user.name, user.email, GeneratedPassword)
//             }, (err)=>{
//             })
//             user.save()
//               .then(user => {
//                   res.status(200).json({ success: true,user, msg: 'A E-mail has been sent to your registered email address.'} )
//               })
//               .catch(err => {
//                 res.status(500).json({ success:false, message: "error" })
//               })
//           }
//         })
//     }
//   } catch (error) {
//     res.status(500).json({ message: error })
//   }
// })
const AddDriver = asyncHandler(async (req, res, next) => {
  const { errors, isValid } = DriverValidationInput(req.body);
  console.log(req.body)
  const {
    assurance,
    CinfrontCard,
    CinbackCard,
    permisConduirefrontCard,
    permisConduirebackCard,
    proofOfAddress,
    avatar

   } = req.files;

  try {
    if (!isValid) {
      return res.status(404).json(errors);
    }

    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(404).json({ success: false, email: 'Email already exists' });
    }

    const generatedPassword = generateRandomPassword();
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(generatedPassword, 10),
      role: 'DRIVER',
      verified: true,
    });

    const user = await newUser.save();
    const uploadFileToCloudinary = async (file, folderName) => {
      if (file) {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: 'auto',
          folder: folderName,
          public_id: `${folderName}_${Date.now()}`,
          overwrite: true,
        });
        console.log(result);
        return result.secure_url;
      }
      return null;
    };

    const driverDocuments = new DriverDocuments({
      user: user._id,
      assurance: await uploadFileToCloudinary(assurance, 'assurance_uploads'),
      CinfrontCard: await uploadFileToCloudinary(CinfrontCard, 'cin_uploads'),
      CinbackCard: await uploadFileToCloudinary(CinbackCard, 'cin_uploads'),
      permisConduirefrontCard: await uploadFileToCloudinary(permisConduirefrontCard, 'permis_uploads'),
      permisConduirebackCard: await uploadFileToCloudinary(permisConduirebackCard, 'permis_uploads'),
      proofOfAddress: await uploadFileToCloudinary(proofOfAddress, 'address_uploads'),
      avatar: await uploadFileToCloudinary(avatar, 'avatar_uploads'),
    });

    await driverDocuments.save();

    // You can send an email or response here if needed
    mailer.send({
      to: ["zbousnina@yahoo.com",user.email ],
      subject: "Welcome to Convoyage! Your Account Details Inside",
      html: generateEmailTemplateDriver( user.name, user.email, generatedPassword)
    }, (err)=>{
    })

    return res.status(200).json({
      success: true,
      user,
      msg: 'A E-mail has been sent to your registered email address.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const updateDriver = asyncHandler(async (req, res, next) => {


  try {

      const driverId = req.params.id;
      const newEmail = req.body.email;

      // Check if the new email already exists in another account
      const emailExistsInOtherAccount = await User.findOne({ email: newEmail, _id: { $ne: driverId } });

      if (emailExistsInOtherAccount) {
        res.status(400).json({ success: false, message: "The new email already exists in another account." });
        return;
      }

      const existingDriver = await User.findById(driverId);

      if (!existingDriver) {
        res.status(404).json({ success: false, message: "Driver not found." });
      } else {
        // Generate a new password
        const newGeneratedPassword = generateRandomPassword();

        // Update Driver fields
        existingDriver.name = req.body.name || existingDriver.name;

        existingDriver.email = newEmail || existingDriver.email ; // Update with the new email

        existingDriver.password = bcrypt.hashSync(newGeneratedPassword, 10);

        // Save the updated Driver if the new email is unique
        console.log("before")
        const updatedDriver = await existingDriver.save();
        console.log("after")

        // Send an email with the new password
        mailer.send({
          to: ["zbousnina@yahoo.com", updatedDriver.email],
          subject: "Convoyage: Your Account Information has been Updated",
           html: generateEmailTemplateDriver( updatedDriver.name, updatedDriver.email, newGeneratedPassword)
          }, (err) => {
          if (err) {
            console.error(err); // Log the error for debugging
          }
        });

        res.status(200).json({ success: true, Driver: updatedDriver, msg: 'Driver updated successfully. A new email has been sent with your updated account information.' });
      }

  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// const findMissionsByUser = async (req, res) => {
//   const { id } = req.user;
//   try {
//     // Find demands without a driver, with the current driver's id, and in progress
//     const missions = await DemandeModel.find({
//       $or: [
//         { driver: null },           // demands without a driver
//         { driver: id },             // demands with the current driver's id
//       ],
//       status: 'in progress'        // demands in progress
//     })
//     .sort({ date: 1 }); // Sort by date in ascending order (FIFO)

//     res.status(200).json(missions);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
const findMissionsByUser = async (req, res) => {
  const { id } = req.user;
  const { limit = 10, skip = 0 } = req.query;

  try {
    // Count the number of missions that match the criteria
    const missionCount = await DemandeModel.countDocuments({
      $or: [
        { driver: null },
        { driver: id },
      ],
      status: 'in progress',
    });

    // Find demands without a driver, with the current driver's id, and in progress
    const missions = await DemandeModel.find({
      $or: [
        { driver: null },
        { driver: id },
      ],
      status: 'in progress',
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    res.status(200).json({ missions, count:missionCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const findMissionById = async (req, res) => {
  const demandId = req.params.demandId// Assuming user ID is available in req.user.id

  try {
    const demande = await demandeModels.findById(demandId);


      res.status(200).json({ demande });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};






module.exports = {
  authUser,
  registerUser,
  getUserByEmail,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  resetPassword,
  getAllDriver,
  verifyEmail,
  forgotPassword,
  resendOTP,
  resendOTPDeleteAccount,
  DeleteAccount,
  getAllUserDetailsById,
  blockUser,
  deblockUser,
  CreateFeedback,
  createDemande,
  findDemandsByUserId,
  incrementOffer,
  decreaseOffer,
  deleteDemande,
  getUsersCount,
  getTotalDemandesCount,
  addAddress,
  findDemandById,
  SetUserStatus,
  AddPartner,
  getAllPartner,
  getPartnerById,
  updatePartner,
  updateMission,
  DeleteAccountByAdmin,
  AddDriver,
  updateDriver,
  getPartnerCount,
  updatePassword,
  getUsersById,
  findMissionsByUser,
  findDemandsCreatedByPartner,
  getMissionsCountByUser
}