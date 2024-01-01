const asyncHandler = require('express-async-handler')
const generateToken = require('../utils/generateToken.js')
const User = require('../models/userModel.js')
var crypto = require('crypto');
var mailer = require('../utils/mailer');
const validateRegisterInput = require('../validations/validateRegisterInput')
const PartnerValidationInput = require('../validations/PartnerInputValidation.js')
const DriverValidationInput = require('../validations/DriverInputValidation.js')
const validateDevisInput = require('../validations/validateDevisInput.js')
const validateFeedbackInput = require('../validations/FeedbackValidation')
const validateLoginInput = require('../validations/login')
const changePasswordValidation = require('../validations/ChangePasswordValidation.js')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verificationTokenModels = require("../models/verificationToken.models");
const { generateOTP,generateRandomPassword, mailTransport, generateEmailTemplate,generateDeleteAccountEmailTemplate,generateEmailTemplateDriver,generateEmailTemplatePartner,generateEmailTemplateAffectation, plainEmailTemplate, generatePasswordResetTemplate, generateEmailTemplateDeleterAccount, generateEmailTemplatePartnerApproval } = require("../utils/mail");
const { isValidObjectId } = require('mongoose');
const { sendError, createRandomBytes } = require("../utils/helper");
const resetTokenModels = require("../models/resetToken.models");
const categorieModel = require("../models/Categorie.model.js");
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
const devisModel = require('../models/devis.model.js');


const createDevis = async (req, res) => {
    const { errors, isValid } = validateDevisInput(req.body);

    try {
      if (isValid) {
        const {
            categorie,
            mission,
            partner,
            montant,
            status,
            distance,
            rectification

         } = req.body;

          // Check if the mission already exists in DevisModel
      const existingDevis = await devisModel.findOne({ mission });

if (existingDevis) {
  errors.mission = "A Devis with this mission already exists";
  return res.status(400).json({ errors });
}
        // Check if the description already exists
           // Check if the mission exists in DemandeModel
      const existingMission = await DemandeModel.findById(mission);

if (!existingMission) {
  errors.mission = "There is no mission with this ID";
  return res.status(400).json({ errors });
}

      // Check if the description already exists in CategorieModel
      const existingCategorie = await categorieModel.findById( categorie );

      if (!existingCategorie) {
        errors.categorie = "There is no categorie with this ID";
        return res.status(400).json({ errors });
      }
        let catExist = await categorieModel.find({  categorie });
        let missExist = await DemandeModel.find({  mission });
        if (!catExist) {
            errors.description = "there is no categorie  with this description"
          return res.status(400).json({ message: 'there is no categorie  with this description' });
        }
        if ( !missExist) {
            errors.description = "there is no  mission with this description"
          return res.status(400).json({ message: 'there is no  mission with this description' });
        }


        // Create new Devis
        const newDevis = new devisModel({
            categorie,
            mission,
            partner,
            montant,
            status,
            distance,
            rectification,
            status: !partner ? "Accepted" : "in progress",
            // status:"in progress"
          });

          // check if the partner not vide   and partner exist
          const createdCategorie = await newDevis.save();
          if (!partner) {
                // Update mission status in DemandeModel to "Accepted"
                await DemandeModel.findByIdAndUpdate(mission, { status: "Accepted" });
            }

        if(partner){
            const partnerExist = await User.findById(partner)
            if(!partnerExist){
                return res.status(400).json({ message: 'there is no partner with this id' });
            }
            else{
                newDevis.partner=partner
                console.log(
                    missExist,

                )
                mailer.send({
        to: ["zbousnina@yahoo.com", partnerExist.email],
        subject: "Convoyage: Mission Approved Notification",
        html: generateEmailTemplatePartnerApproval(partnerExist?.contactName,partnerExist?.name, montant, existingMission?.postalAddress, existingMission?.postalDestination),
      }, (err) => {});
            }

        }

        // Save Devis to database
        return res.status(201).json({message:"Created Successfully", data :createdCategorie});


        res.status(201).json({ message: 'Categorie created successfully', categorie: createdCategorie });
      } else {
        return res.status(400).json(errors);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


  const UpdateDevis = async (req, res) => {
  const { errors, isValid } = validateDevisInput(req.body);

  try {
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    const {
      categorie,
      mission,
      partner,
      montant,
      status,
      distance,
      rectification
    } = req.body;

    // Check if the mission already exists in DevisModel
    const existingDevis = await devisModel.findById(req.params.id);
    if (!existingDevis) {
      errors.mission = "There is no Devis with this ID";
      return res.status(400).json({ errors });
    }


    // Check if the mission exists in DemandeModel
    const existingMission = await DemandeModel.findById(mission);
    if (!existingMission) {
      errors.mission = "There is no mission with this ID";
      return res.status(400).json({ errors });
    }

    // Create an updated object for the model
    const updatedDevis = {
      categorie,
      mission,
      partner,
      montant,
      status,
      distance,
      rectification,
      // status:"in progress"
    };

    // Save the new data to the database
    const updatedDevisData = await devisModel.findByIdAndUpdate(
      req.params.id,
      updatedDevis,
      { new: true }
    );
    if (!partner) {
                // Update mission status in DemandeModel to "Accepted"
                await DemandeModel.findByIdAndUpdate(mission, { status: "Accepted" });
            }

    return res.status(200).json({
      message: 'Devis updated successfully',
      data: updatedDevisData
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};




  const getAllCategorie= async (req, res) => {
    // console.log(req.user.id)
    try {
        const categorie = await categorieModel.find({});
        res.status(200).json({ categorie})
        // return basicInfo;
    } catch (error) {
        res.status(500).json({message1: "error2", message: error.message})
    }
  };
  const getAllDevisByPartner= async (req, res) => {
    // console.log(req.user.id)
    try {
        const Devis = await devisModel.find({partner:req.params.id});
        // const categorie = await categorieModel.findById({req.parms.id});
        res.status(200).json({ Devis})
        // return basicInfo;
    } catch (error) {
        res.status(500).json({message1: "error2", message: error.message})
    }
  };


  module.exports = {
    createDevis,
    getAllCategorie,
    UpdateDevis,
    getAllDevisByPartner
  }