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
const factureModel = require('../models/facture.model.js');
const DriverFactureModel = require('../models/DriverFacture.model.js');


const createFacture = async (req, res) => {
    console.log(req.body)
    try {
        // Extract data from the request body
        const { partner, from, to, totalAmount } = req.body;


        // Create a new Facture instance
        const newFacture = new factureModel({
            partner,
            from,
            to,
            totalAmmount: totalAmount
        });

        // Save the Facture to the database
        const savedFacture = await newFacture.save();

        // Respond with the saved Facture
        res.status(201).json(savedFacture);
    } catch (error) {
        // Handle any errors that occur during the creation process
        console.error(error);
        res.status(500).json({ error5: 'Internal Server Error' });
    }
};
const calculateTotalAmmount = (devisArray) => {
  // Assuming each devis has a 'totalAmmount' field
  let totalAmmount = 0;

  devisArray.forEach((devisItem) => {
    // Add the totalAmmount of each devis to the totalAmmount for FactureDriver
    totalAmmount += parseFloat(devisItem.totalAmmount) || 0;
  });

  return totalAmmount.toString(); // Convert the total to string if needed
};
const fetchFactureByDriver = async (req, res) => {
  const partner = req.user.id;
  let { from, to } = req.body; // Use let instead of const
  try {
    console.log(from, to);
    let query = { partner: partner };

    // If fromDate and toDate are provided, add date filter to the query
    if (from && to && from != 'Invalid Date' && to != 'Invalid Date') {
      from = new Date(from); // Use let instead of const
      to = new Date(to);     // Use let instead of const

      if (!isNaN(from.valueOf()) && !isNaN(to.valueOf())) {
        // Assuming 'createdAt' is the field in the schema where the date is stored
        query.createdAt = { $gte: from, $lte: to };
      } else {
        res.status(400).json({ message: 'Invalid date format in request parameters.' });
        return;
      }
    }

    const devis = await factureModel.find(query);
    // Create a new FactureDriver based on the fetched devis
    const factureDriver = new DriverFactureModel({
      driver: req.user.id,
      factures: devis.map((devisItem) => devisItem._id),
      from: from.toString(),
      to: to.toString(),
      totalAmmount: calculateTotalAmmount(devis), // You need to implement this function
    });

    // Save the new FactureDriver to the database
    await factureDriver.save();


    res.status(200).json({ devis,factureDriver  });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
const fetchAllFacturesByDriver = async (req, res) => {
  const driver = req.user.id;
  try {
    const factures = await DriverFactureModel.find({ driver: driver })
  .populate({
    path: 'factures',
    populate: [
      { path: 'mission' },  // Assuming 'mission' is a field in the 'factures' array
      // { path: 'anotherField' }  // Replace 'anotherField' with the actual field name in 'factures'
    ]
  });

    if (!factures) {
      return res.status(404).json({ error: 'Facture not found' });
    }
    res.status(200).json(factures);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }

};

const PayeeFacture = async (req, res)=> {
    const id = req.params.id;
    const partner = req.user.id
    try{
        const facture = await factureModel.findById(id);
        if(!facture){
            return res.status(404).json({error: 'Facture not found'});
        }
         // Check if the 'payed' attribute exists
         if ('payed' in facture) {
          // Toggle the value of 'payed'
          facture.payed = !facture.payed;
      } else {
          // If 'payed' does not exist, set it to true
          facture.payed = true;
      }

        await facture.save();
        res.status(200).json(facture);
        }catch(e){
        res.status(500).json({error: e.message});
        }
}
const PayeeFactureDriver = async (req, res)=> {
  const id = req.params.id;
  const partner = req.user.id
  try{
      const facture = await DriverFactureModel.findById(id);
      if(!facture){
          return res.status(404).json({error: 'Facture not found'});
      }
       // Check if the 'payed' attribute exists
       if ('payed' in facture) {
        // Toggle the value of 'payed'
        facture.payed = !facture.payed;
    } else {
        // If 'payed' does not exist, set it to true
        facture.payed = true;
    }

      await facture.save();
      res.status(200).json(facture);
      }catch(e){
      res.status(500).json({error: e.message});
      }
}




const fetchFactureByPartner = async (req, res) => {
    try {
        const partnerId = req.user.id;

        // Use Mongoose to find all Factures for the given partnerId
        const factures = await factureModel.find({ partner: partnerId });

        // Respond with the fetched Factures
        res.status(200).json(factures);
    } catch (error) {
        // Handle any errors that occur during the fetch process
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const fetchFactureById = async (req, res)=> {
    const id = req.params.id;
    const partner = req.user.id
    try{
        const facture = await factureModel.findById(id);
        if(!facture){
            return res.status(404).json({error: 'Facture not found'});
        }
        console.log(facture.from)
        let query = { partner: partner };

        // If fromDate and toDate are provided, add date filter to the query
        if (facture?.from && facture?.to && facture?.from !== 'Invalid Date' && facture?.to !== 'Invalid Date') {
          const from = new Date(facture?.from);
          const to = new Date(facture?.to);

          if (!isNaN(from.valueOf()) && !isNaN(to.valueOf())) {
            // Assuming 'createdAt' is the field in the schema where the date is stored
            query.createdAt = { $gte: from, $lte: to };
          } else {
            res.status(400).json({ message: 'Invalid date format in request parameters.' });
            return;
          }
        }

        const devis = await devisModel
          .find(query)
          .populate({
            path: 'mission',
            populate: {
              path: 'driver',
            },
          })
          .populate('categorie');

        res.status(200).json({devis,facture });
        }catch(e){
        res.status(500).json({error: e.message});
        }

}
const fetchFacturesByDriver = async(req, res)=> {
    const driver = req.user.id
    try{
        const factures = await factureModel.find({ partner:driver }).populate("partner").populate("mission");
        if(!factures){
            return res.status(404).json({error: 'Facture not found'});
        }
        res.status(200).json(factures);
        }catch(e){
        res.status(500).json({error: e.message});
        }
}



module.exports = {
    createFacture,
    fetchFactureByPartner,
    fetchFactureById,
    fetchFacturesByDriver,
    fetchFactureByDriver,
    fetchAllFacturesByDriver,
    PayeeFacture,
    PayeeFactureDriver
  }

