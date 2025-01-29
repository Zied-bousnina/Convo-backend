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
const validateUpdateCategorie = require('../validations/validateUpdateCategorie.js');


const createCategorie = async (req, res) => {
    const { errors, isValid } = validateCategorieInput(req.body);


    try {
      if (isValid) {
        const { description, unitPrice , distance} = req.body;

        // Check if the description already exists
        const existingCategorie = await categorieModel.findOne({ description });
        const existingCategoriedistance = await categorieModel.findOne({
          distance

        });

        if (existingCategoriedistance) {
          // If the category with the same distance exists for a different category, return an error
          errors.distance = "La catégorie avec cette distance existe déjà";
          return res.status(400).json({ message: 'La catégorie avec cette distance existe déjà', errors });
        }

        if (existingCategorie) {
            errors.description = "Categorie with this description already exists"
          return res.status(400).json({ message: 'Categorie with this description already exists' });
        }

        // Create a new categorie object
        const newCategorie = new categorieModel({
          description,
          unitPrice,
          distance

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

    try {
        const categorie = await categorieModel.find({});
        res.status(200).json({ categorie})
        // return basicInfo;
    } catch (error) {
        res.status(500).json({message1: "error2", message: error.message})
    }
  };

  const FindCategorieByid = async (req, res)=> {

    try {
      const categorie = await categorieModel.findById(req.params.id);
      if (!categorie) {
        return res.status(404).json({ message: 'Categorie not found' });
      }
      res.status(200).json({ categorie });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  const deleteCategorie = async (req, res) => {
  const demandId = req.params.id; // Assuming demandId is provided as a route parameter

  try {
    // Check if the demand exists
    const existingDemande = await categorieModel.findById(demandId);

    if (!existingDemande) {
      return res.status(404).json({ message: 'categorie not found' });
    }

    // Check if the user making the request is the owner of the demand


    // Delete the demand
    await existingDemande.remove();

    res.status(200).json({ message: 'categorie deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const UpdateCategorie = async (req, res) => {
  const { errors, isValid } = validateUpdateCategorie(req.body);

  try {
    if (isValid) {
      const categoryId = req.params.id
      const {  description, unitPrice , distance} = req.body;
      const existingCategoriedistance = await categorieModel.findOne({
        distance,
        _id: { $ne: categoryId } // Exclude the current category ID
      });

      if (existingCategoriedistance) {
        // If the category with the same distance exists for a different category, return an error
        errors.distance = "La catégorie avec cette distance existe déjà";
        return res.status(400).json({ message: 'La catégorie avec cette distance existe déjà', errors });
      }

      // Find the existing category by description excluding the current category
      const existingCategorie = await categorieModel.findOne({
        description,
        _id: { $ne: categoryId } // Exclude the current category ID
      });

      if (existingCategorie) {
        // If the category with the same description exists for a different category, return an error
        errors.description = "Categorie with this description already exists";
        return res.status(400).json({ message: 'Categorie with this description already exists' });
      }

      // Find the current category by ID
      const currentCategorie = await categorieModel.findById(categoryId);

      if (!currentCategorie) {
        // If the current category does not exist, return an error
        return res.status(404).json({ message: 'Categorie not found' });
      }

      // Update the current category
      currentCategorie.description = description ?
        description : currentCategorie.description
      ;
      currentCategorie.unitPrice =
        unitPrice ? unitPrice : currentCategorie.unitPrice;

      currentCategorie.distance =

        distance ? distance : currentCategorie.distance;

      // Save the updated category
      const updatedCategorie = await currentCategorie.save();

      res.status(200).json({ message: 'Categorie updated successfully', categorie: updatedCategorie });
    } else {
      return res.status(400).json(errors);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


  module.exports = {
    createCategorie,
    getAllCategorie,
    FindCategorieByid,
    deleteCategorie,
    UpdateCategorie
  }
