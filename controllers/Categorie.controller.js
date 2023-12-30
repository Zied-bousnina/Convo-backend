const asyncHandler = require('express-async-handler')
const generateToken = require('../utils/generateToken.js')
const User = require('../models/userModel.js')
var crypto = require('crypto');
var mailer = require('../utils/mailer');
const validateRegisterInput = require('../validations/validateRegisterInput')
const PartnerValidationInput = require('../validations/PartnerInputValidation.js')
const DriverValidationInput = require('../validations/DriverInputValidation.js')
const validateCategorieInput = require('../validations/validateCategorieInput.js')
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


const createCategorie = async (req, res) => {
    const { errors, isValid } = validateCategorieInput(req.body);

    try {
      if (isValid) {
        const { description, unitPrice } = req.body;

        // Check if the description already exists
        const existingCategorie = await categorieModel.findOne({ description });

        if (existingCategorie) {
            errors.description = "Categorie with this description already exists"
          return res.status(400).json({ message: 'Categorie with this description already exists' });
        }

        // Create a new categorie object
        const newCategorie = new categorieModel({
          description,
          unitPrice,
        });

        // Save the new categorie
        const createdCategorie = await newCategorie.save();

        res.status(201).json({ message: 'Categorie created successfully', categorie: createdCategorie });
      } else {
        return res.status(400).json(errors);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
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


  module.exports = {
    createCategorie,
    getAllCategorie
  }
