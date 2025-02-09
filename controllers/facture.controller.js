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
const businessDetailsModel = require('../models/businessDetails.model.js');

// const stripe = require("stripe")("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")
// const stripe = require("stripe")("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")
const logActivity = require("../utils/logger"); // Import logger

const createFacture = async (req, res) => {
    console.log(req.body);
    try {
        const { partner, from, to, totalAmount, missions } = req.body;

        if (!missions || missions.length === 0) {
            await logActivity("Failed to Create Facture", req.user.id, { reason: "No missions selected" });
            return res.status(400).json({ error: "No missions selected" });
        }

        const newFacture = new factureModel({
            partner,
            from,
            to,
            totalAmount,
            missions, // Store selected missions
        });

        const savedFacture = await newFacture.save();


        await logActivity("Created Facture", req.user.id, { factureId: savedFacture._id, partner, from, to, totalAmount, missions });

        res.status(201).json(savedFacture);
    } catch (error) {
        console.error("Error creating facture:", error);
        await logActivity("Error in createFacture", req.user.id, { error: error.message });
        res.status(500).json({ error: "Internal Server Error" });
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



const PayeeFacture = async (req, res) => {
    const id = req.params.id;
    const partner = req.user.id;

    try {
        const facture = await factureModel.findById(id);

        if (!facture) {
            await logActivity("Failed to Process Payment", partner, { reason: "Facture not found", factureId: id });
            return res.status(404).json({ error: 'Facture not found' });
        }

        // Check if the 'payed' attribute exists and toggle its value
        if ('payed' in facture) {
            facture.payed = !facture.payed;
        } else {
            facture.payed = true;
        }

        await facture.save();

        await logActivity("Updated Facture Payment Status", partner, { factureId: id, payed: facture.payed });

        res.status(200).json(facture);
    } catch (e) {
        await logActivity("Error in PayeeFacture", partner, { error: e.message });
        res.status(500).json({ error: e.message });
    }
};
const PayeeFactureDriver = async (req, res) => {
  const id = req.params.id;
  const partner = req.user.id;

  try {
      const facture = await DriverFactureModel.findById(id);

      if (!facture) {
          await logActivity("Failed to Process Driver Facture Payment", partner, { reason: "Facture not found", factureId: id });
          return res.status(404).json({ error: 'Facture not found' });
      }

      // Check if the 'payed' attribute exists and toggle its value
      if ('payed' in facture) {
          facture.payed = !facture.payed;
      } else {
          facture.payed = true;
      }

      await facture.save();

      await logActivity("Updated Driver Facture Payment Status", partner, { factureId: id, payed: facture.payed });

      res.status(200).json(facture);
  } catch (e) {
      await logActivity("Error in PayeeFactureDriver", partner, { error: e.message });
      res.status(500).json({ error: e.message });
  }
};

const PayeeEnligne = async (req, res) => {
  const factureId = req.params.id;
  let { id } = req.body;

  try {
      const stripe = await getStripe();
      const facture = await factureModel.findById(factureId);

      if (!facture) {
          await logActivity("Failed Online Payment", req.user.id, { reason: "Facture not found", factureId });
          return res.status(404).json({ error: 'Facture not found' });
      }

      const payment = await stripe.paymentIntents.create({
          amount: Math.round(facture.totalAmmount * 100),
          currency: "EUR",
          description: "Carvoy company",
          payment_method: id,
          confirm: true,
          return_url: "https://convo-1.netlify.app/admin/facture-DriverdetailsPar/65b0ee02787321004ef46553"
      });

      facture.paymentMethod = "Paiement En ligne";
      facture.payed = true;
      await facture.save();

      await logActivity("Successful Online Payment", req.user.id, { factureId, paymentId: payment.id, amount: facture.totalAmmount });

      res.json({
          message: "Payment successful",
          success: true
      });
  } catch (error) {
      await logActivity("Error in PayeeEnligne", req.user.id, { error: error.message, factureId });
      res.json({
          message: "Payment failed",
          success: false
      });
  }
};
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
      } else {
          // If no existing facture found, create a new one
          facture = new factureModel({
              mission: missionId,
              partner: partnerId,
              totalAmmount: totalAmmount,
              freeComment: freeComment,
              referenceNumber: referenceNumber,
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

      // Update the facture as paid
      savedFacture.payed = true;
      await savedFacture.save();

      await logActivity("Successful Online Payment - Partner", req.user.id, {
          missionId,
          partnerId,
          totalAmmount,
          factureId: savedFacture._id,
          paymentId: payment.id
      });

      res.json({
          message: "Payment successful",
          success: true,
          factureId: savedFacture._id, // Return the ID of the created or updated facture
      });
  } catch (error) {
      await logActivity("Error in PayeeEnlignePartner", req.user.id, { error: error.message, missionId, partnerId });

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

  const PayerEnligneDriver = async (req, res) => {
    const factureId = req.params.id;
    let { id } = req.body;

    try {
        const facture = await DriverFactureModel.findById(factureId);

        if (!facture) {
            await logActivity("Failed Online Payment - Driver", req.user.id, { reason: "Facture not found", factureId });
            return res.status(404).json({ error: 'Facture not found' });
        }

        const stripe = await getStripe();
        const payment = await stripe.paymentIntents.create({
            amount: Math.round(calculateTVA(Number(facture.totalAmmount), tvaRate).montantTTC * 100),
            currency: "EUR",
            description: "CarVoy company",
            payment_method: id,
            confirm: true,
            return_url: "https://convo-1.netlify.app/admin/facture-DriverdetailsPar/65b0ee02787321004ef46553"
        });

        // facture.paymentMethod = "Paiement En ligne"
        facture.payed = true;
        await facture.save();

        await logActivity("Successful Online Payment - Driver", req.user.id, {
            factureId,
            paymentId: payment.id,
            amount: facture.totalAmmount
        });

        res.json({
            message: "Payment successful",
            success: true
        });
    } catch (error) {
        await logActivity("Error in PayerEnligneDriver", req.user.id, { error: error.message, factureId });

        res.json({
            message: "Payment failed",
            success: false
        });
    }
};








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
const fetchFacturePartnerById = async (req, res) => {
  const id = req.params.id;
  const partner = req.user.id;

  try {
    let statusValues = ['Confirmée', 'Affectée', 'En retard', 'Démarrée', 'Terminée', "Confirmée driver"];

    // ✅ Populate the entire array of 'missions' instead of a single 'mission'
    const facture = await factureModel
      .findById(id)
      .populate("partner")
      .populate({
        path: "mission", // Populate the array of missions
        populate: {
          path: "driver", // Populate 'driver' inside each mission
        },
      })
      facture.missions = await Promise.all(
        facture.missions.map(async (missionId) => {
console.log('missionId',missionId)
          return await devisModel.findById(missionId).populate("mission");
        })
      );
console.log(facture)
    if (!facture) {
      return res.status(404).json({ error: 'Facture not found' });
    }

    let query = { partner: partner, status: { $in: statusValues } };

    if (
      facture?.from &&
      facture?.to &&
      facture?.from !== 'Invalid Date' &&
      facture?.to !== 'Invalid Date' &&
      facture.from !== '...'
    ) {
      const from = new Date(facture?.from).toISOString();
      const to = new Date(facture?.to).toISOString();
      query.createdAt = { $gte: new Date(from), $lte: new Date(to) };
    }

    if (!isNotValidDate(facture.from)) {
      // ✅ Find and populate all missions inside devis
      const devis = await devisModel
        .find(query)
        .populate({
          path: 'mission',
          populate: {
            path: 'driver',
          },
        })
        .populate('categorie');

      res.status(200).json({ devis: facture.missions, facture });

    } else {
      // ✅ If there's only one mission, return it in an array
      const devis = [{ mission: facture.missions }];
      res.status(200).json({ devis, facture });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

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

const PayeFactureByPartnerHorLigne = async (req, res) => {
  const id = req.params.id;

  try {
      const facture = await factureModel.findById(id);

      if (!facture) {
          await logActivity("Failed Offline Payment - Partner", req.user.id, { reason: "Facture not found", factureId: id });
          return res.status(404).json({ error: 'Facture not found' });
      }

      // Update payment method to "Paiement En cours – Hors Ligne"
      facture.paymentMethod = "Paiement En cours – Hors Ligne";
      await facture.save();

      await logActivity("Updated Offline Payment Status - Partner", req.user.id, { factureId: id, paymentMethod: facture.paymentMethod });

      res.status(200).json(facture);
  } catch (e) {
      await logActivity("Error in PayeFactureByPartnerHorLigne", req.user.id, { error: e.message, factureId: id });

      res.status(500).json({ error: e.message });
  }
};

const saveOrUpdateBusinessDetails = async (req, res) => {
  const { address, city, phone, siret } = req.body;
  console.log(req.body);

  try {
      let businessDetails = await businessDetailsModel.findOne();

      if (businessDetails) {
          // Update existing details
          businessDetails.address = address;
          businessDetails.city = city;
          businessDetails.phone = phone;
          businessDetails.siret = siret;

          await logActivity("Updated Business Details", req.user.id, { address, city, phone, siret });
      } else {
          // Create new details
          businessDetails = new businessDetailsModel({ address, city, phone, siret });

          await logActivity("Created Business Details", req.user.id, { address, city, phone, siret });
      }

      await businessDetails.save();
      res.status(200).json({ success: true, businessDetails });
  } catch (error) {
      console.error("Error saving business details:", error);
      await logActivity("Error in saveOrUpdateBusinessDetails", req.user.id, { error: error.message });

      res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// 🔹 Get Business Details
const getBusinessDetails = async (req, res) => {
  try {
    const businessDetails = await businessDetailsModel.findOne();
    if (!businessDetails) {
      return res.status(404).json({ success: false, message: "No details found" });
    }
    res.status(200).json({ success: true, businessDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// 🔹 Delete Business Details
const deleteBusinessDetails = async (req, res) => {
  try {
      const businessDetails = await businessDetailsModel.findOne();

      if (!businessDetails) {
          await logActivity("Failed to Delete Business Details", req.user.id, { reason: "No details found" });
          return res.status(404).json({ success: false, message: "No details found" });
      }

      await businessDetailsModel.deleteOne();

      await logActivity("Deleted Business Details", req.user.id, { businessId: businessDetails._id });

      res.status(200).json({ success: true, message: "Business details deleted" });
  } catch (error) {
      await logActivity("Error in deleteBusinessDetails", req.user.id, { error: error.message });

      res.status(500).json({ success: false, message: "Server Error", error });
  }
};

module.exports = {
  saveOrUpdateBusinessDetails,
  deleteBusinessDetails,
  getBusinessDetails,
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

