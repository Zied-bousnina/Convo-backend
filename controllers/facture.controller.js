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
const { getStripe } = require('../config/stripe.js');

// const stripe = require("stripe")("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")
// const stripe = require("stripe")("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")
const createFacture = async (req, res) => {

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

const fetchStatistiquesByPartner = async (req, res) => {
  try {
    const partnerId = req.user.id; // Ensure you have authentication middleware setting req.user
    const { startDate, endDate } = req.query;

    // Helper function to validate date strings
    const isValidDate = (date) => {
      return !isNaN(new Date(date).getTime());
    };

    // Validate and initialize the date filter
    const dateFilter = {};
    if (isValidDate(startDate) && isValidDate(endDate)) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch Factures statistics
    const facturesPayees = await factureModel.countDocuments({
      partner: partnerId,
      payed: true,
      ...dateFilter,
    });

    const facturesNonPayees = await factureModel.countDocuments({
      partner: partnerId,
      payed: false,
      ...dateFilter,
    });

    // Fetch Demande statistics
    const missionsAccomplies = await DemandeModel.countDocuments({
      driver: partnerId,
      status: "completed",
      ...dateFilter,
    });

    const missionsRejetees = await DemandeModel.countDocuments({
      driver: partnerId,
      status: "rejected",
      ...dateFilter,
    });

    // Construct the response
    const statistiques = {
      factures: {
        payees: facturesPayees,
        nonPayees: facturesNonPayees,
      },
      missions: {
        accomplies: missionsAccomplies,
        rejetees: missionsRejetees,
      },
    };

    return res.status(200).json(statistiques);
  } catch (error) {
    console.error("Error fetching statistiques:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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

const PayeeEnligne = async (req, res)=> {
    const factureId = req.params.id;

    let {id } = req.body
    try {
      const stripe = await getStripe();
      const facture = await factureModel.findById(factureId);
      if(!facture){
          return res.status(404).json({error: 'Facture not found'});
      }
      const payment = await stripe.paymentIntents.create({
        amount: Math.round(facture.totalAmmount * 100),
        currency: "EUR",
        description: "Carvoy company",
        payment_method: id,
        confirm: true,
        return_url: "https://convo-1.netlify.app/admin/facture-DriverdetailsPar/65b0ee02787321004ef46553"
      })


    facture.paymentMethod = "Paiement En ligne"
    facture.payed = true
    await facture.save()
      res.json({
        message: "Payment successful",
        success: true
      })
    } catch (error) {

      res.json({
        message: "Payment failed",
        success: false
      })

    }
  }
  const PayeeEnlignePartner = async (req, res) => {
    const { missionId, partnerId, totalAmmount, freeComment, referenceNumber } = req.body;

    try {
      // Try to find an existing facture with the given missionId
      let facture = await factureModel.findOne({ mission: missionId });
      const stripe = await getStripe();
      if (facture) {
        // If a facture exists, update it
        facture.partner = partnerId;
        facture.totalAmmount = totalAmmount;
        facture.freeComment = freeComment;
        facture.referenceNumber = referenceNumber;
        // Update other fields as necessary
      } else {
        // If no existing facture found, create a new one
        facture = new factureModel({
          mission: missionId,
          partner: partnerId,
          totalAmmount: totalAmmount,
          freeComment: freeComment,
          referenceNumber: referenceNumber,
          // Set other necessary fields as per your requirements
          from: "...", // Example placeholder
          to: "...", // Example placeholder
          paymentMethod: "Paiement En ligne",
          payed: false, // This will be updated to true after payment succeeds
        });
      }

      // Save the new or updated facture to the database
      const savedFacture = await facture.save();

      // Proceed with the payment
      const payment = await stripe.paymentIntents.create({
        amount: Math.round(totalAmmount * 100),
        currency: "EUR",
        description: "Carvoy company",
        payment_method: req.body.id, // Assuming payment method ID is passed in request body
        confirm: true,
        return_url: "https://convo-1.netlify.app/admin/facture-DriverdetailsPar/65b0ee02787321004ef46553",
      });

      // Log the successful payment for debugging purposes


      // Update the facture as paid
      savedFacture.payed = true;
      await savedFacture.save();

      res.json({
        message: "Payment successful",
        success: true,
        factureId: savedFacture._id, // Return the ID of the created or updated facture
      });
    } catch (error) {

      res.status(500).json({
        message: "Payment failed",
        success: false,
        error: error.message,
      });
    }
  };




  const tvaRate = 20; // Change this to your actual TVA rate

  const calculateTVA = (montantHT, tvaRate) => {

    const TVA = montantHT * (tvaRate / 100);
    const montantTTC = montantHT + TVA;
    const montantPur = montantHT - TVA;

    return {
      montantHT,
      TVA,
      montantTTC,
      montantPur
    };
  };
  const PayerEnligneDriver = async (req, res)=> {
    const factureId = req.params.id;

    let {id } = req.body
    try {

      const facture = await DriverFactureModel.findById(factureId);
      if(!facture){
          return res.status(404).json({error: 'Facture not found'});
      }
      const stripe = await getStripe();
      const payment = await stripe.paymentIntents.create({
        amount:  Math.round(calculateTVA(Number(facture.totalAmmount), tvaRate).montantTTC * 100),
        currency: "EUR",
        description: "CarVoy company",
        payment_method: id,
        confirm: true,
        return_url: "https://convo-1.netlify.app/admin/facture-DriverdetailsPar/65b0ee02787321004ef46553"
      })

    // facture.paymentMethod = "Paiement En ligne"
    facture.payed = true
    await facture.save()

      res.json({
        message: "Payment successful",
        success: true
      })
    } catch (error) {

      res.json({
        message: "Payment failed",
        success: false
      })

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
const fetchFactureByMissionId = async (req, res) => {
  try {
      const missionId = req.params.id;

      // Use Mongoose to find all Factures for the given missionId
      const factures = await factureModel.find({ mission: missionId });

      // Respond with the fetched Factures
      res.status(200).json(factures);
  } catch (error) {
      // Handle any errors that occur during the fetch process
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};
const getTotalAmountByPartner = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query; // Extract filters from the query string
    const partnerId = req.user.id;

    // Check if the partner exists
    if (!partnerId) {
      return res.status(404).json({ error: "Partner not found" });
    }

    // Build the filter object
    const filters = {};

    if (req.user.role !== "ADMIN") {
      filters.partner = partnerId; // Filter by partner ID for non-admin users
    }

    // Validate dates and apply date filter only if valid dates are provided
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isNaN(start) && !isNaN(end)) {
      filters.createdAt = { $gte: start, $lte: end };
    }

    // Apply status filter if provided
    if (status) {
      filters.status = status;
    }



    // Fetch factures based on the filters
    const factures = await factureModel.find(filters);

    // Calculate the total amount
    const totalAmount = factures.reduce((sum, facture) => {
      const amount = parseFloat(facture.totalAmmount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Respond with the total amount
    res.status(200).json({ totalAmount });
  } catch (error) {
    // Handle errors
    console.error("Error in getTotalAmountByPartner:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





const fetchFactureById = async (req, res)=> {
    const id = req.params.id;
    const partner = req.user.id
    try{
      let statusValues = ['Confirmée', 'Affectée', 'En retard', 'Démarrée', 'Terminée', "Confirmée driver"];
        const facture = await factureModel.findById(id).populate("partner");
        if(!facture){
            return res.status(404).json({error: 'Facture not found'});
        }

        let query = { partner: partner, status: { $in: statusValues  }}

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
function isNotValidDate(value) {
  const date = new Date(value);
  return isNaN(date.getTime()); // Returns true if not a valid date
}
const fetchFacturePartnerById = async (req, res)=> {
  const id = req.params.id;
  const partner = req.user.id

  try{
    let statusValues = ['Confirmée', 'Affectée', 'En retard', 'Démarrée', 'Terminée', "Confirmée driver"];
    const facture = await factureModel.findById(id).populate("partner").populate("mission");

      if(!facture){
          return res.status(404).json({error: 'Facture not found'});
      }

      let query = { partner: partner, status: { $in: statusValues  }}
      if (facture?.from && facture?.to && facture?.from !== 'Invalid Date' && facture?.to !== 'Invalid Date' && !facture.from =='...' ) {
        // const from = new Date(facture?.from);
        // const to = new Date(facture?.to);

        const from = new Date(facture?.from).toISOString();
        const to = new Date(facture?.to).toISOString();
        query.createdAt = { $gte: new Date(from), $lte: new Date(to) };


      }


if(!isNotValidDate(facture.from)){


  const devis = await devisModel
  .find(query)
  .populate({
    path: 'mission',
    populate: {
      path: 'driver',
    },
  })
  .populate('categorie')

  res.status(200).json({devis,facture });

}else{


  const devis = [{mission:facture.mission}]


  res.status(200).json({devis,facture });
}
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

const PayeFactureByPartnerHorLigne = async (req, res)=> {
    const id = req.params.id;

    try{
        const facture = await factureModel.findById(id);
        if(!facture){
            return res.status(404).json({error: 'Facture not found'});
        }
          // Check if the 'payed' attribute exists
       facture.paymentMethod = "Paiement En cours – Hors Ligne"

        await facture.save();
        res.status(200).json(facture);
        }catch(e){
        res.status(500).json({error: e.message});
        }
}



module.exports = {
    createFacture,
    fetchFactureByPartner,
    fetchFactureByMissionId,
    fetchFactureById,
    fetchFacturePartnerById,
    fetchFacturesByDriver,
    fetchFactureByDriver,
    fetchAllFacturesByDriver,
    PayeeFacture,
    PayeeFactureDriver,
    PayeFactureByPartnerHorLigne,
    PayeeEnligne,
    PayeeEnlignePartner,
    PayerEnligneDriver,
    getTotalAmountByPartner,
    fetchStatistiquesByPartner
  }

