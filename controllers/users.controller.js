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
const { generateOTP,generateRandomPassword, mailTransport, generateEmailTemplate,generateDeleteAccountEmailTemplate,generateEmailTemplateDriver,generateEmailTemplatePartner,generateEmailTemplateAffectation, plainEmailTemplate, generatePasswordResetTemplate, generateEmailTemplateDeleterAccount, generateEmailTemplateValidationAccountByAdmin, generateEmailTemplateRefusAccountByAdmin } = require("../utils/mail");
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
const devisModel = require('../models/devis.model.js');
const userModel = require('../models/userModel.js');
const factureModel = require('../models/facture.model.js');
const DriverFactureModel = require('../models/DriverFacture.model.js');
const driverDocumentsModel = require('../models/driverDocuments.model.js');
const { update } = require('lodash');
const partnerCompleteProfileValidation = require('../validations/partnerCompleteProfileValidation.js');
const logActivity = require("../utils/logger");
const ActivityLog = require('../models/ActivityLog.model.js');



const fetchCurrentUser = async(req, res)=> {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
const createDemande = async (req, res) => {
  const { errors, isValid } = validateDemandeInput(req.body);

  try {
      if (isValid) {
          const {
              address,
              destination,
              offer,
              time,
              comment,
              postalAddress,
              postalDestination,
              distance,
              dateDepart,
              driverIsAuto,
              driver,
              vehicleType,
              missionType
          } = req.body;

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
              driver,
              missionType,
              vehicleType,
              time
          });

          // Save the new demand
          const createdDemande = await newDemande.save();

          // Check if driver attribute is not null
          if (driver) {
              // Find the user with the specified driver ID
              const driverUser = await User.findById(driver);

              if (driverUser) {
                  // Send an email to the driverUser
                  mailer.send({
                      to: ["zbousnina@yahoo.com", driverUser.email],
                      subject: "Convoyage Mission Affectation Notification",
                      html: generateEmailTemplateAffectation(driverUser.name, newDemande),
                  }, (err) => {});

                  await logActivity("Created Demande with Driver", req.user.id, {
                      demandeId: createdDemande._id,
                      driverId: driver,
                      driverEmail: driverUser.email
                  });
              }
          } else {
              await logActivity("Created Demande without Driver", req.user.id, {
                  demandeId: createdDemande._id
              });
          }

          res.status(201).json({ message: 'Demande created successfully', demande: createdDemande });
      } else {
          await logActivity("Failed to Create Demande", req.user.id, { reason: "Validation failed", errors });

          return res.status(404).json(errors);
      }
  } catch (error) {
      await logActivity("Error in createDemande", req.user.id, { error: error.message });

      res.status(500).json({ message: error.message });
  }
};
const createDemandeNewVersion = async (req, res) => {
  const { errors, isValid } = validateDemandeInput(req.body);

  if (!isValid) {
      await logActivity("Failed to Create Demande", req.user.id, { reason: "Validation failed", errors });
      return res.status(400).json(errors);
  }

  try {
      const {
          address,
          destination,
          offer,
          time,
          comment,
          postalAddress,
          postalDestination,
          distance,
          dateDepart,
          driverIsAuto,
          vehicleType,
          missionType,
          price,
          selectedServices,
          transport,
          mail,
          remunerationAmount,
          immatriculation,
          vehicleData,
          phone
      } = req.body;

      const identityProof = req.files?.identityProof;
      const vehicleRegistration = req.files?.vehicleRegistration;

      const uploadFileToCloudinary = async (file, folderName) => {
          if (file) {
              const result = await cloudinary.uploader.upload(file?.path, {
                  resource_type: 'auto',
                  folder: folderName,
                  public_id: `${folderName}_${Date.now()}`,
                  overwrite: true,
              });

              return result.secure_url;
          }
          return null;
      };

      // Upload files
      const identityProofUrl = await uploadFileToCloudinary(identityProof, 'identityProof');
      const vehicleRegistrationUrl = await uploadFileToCloudinary(vehicleRegistration, 'vehicleRegistration');

      const taxRate = 0.20; // 20% tax rate
      const totalTTC = price * (1 + taxRate);

      // Create a new demand object
      const newDemande = new demandeModels({
          user: req.user.id,
          address,
          destination,
          comment,
          mail,
          postalAddress,
          postalDestination,
          offer,
          price: Number(totalTTC),
          distance,
          dateDepart,
          driverIsAuto,
          services: { ...selectedServices },
          transport,
          remunerationAmount,
          immatriculation: vehicleData.immat,
          phone,
          missionType,
          vehicleType,
          time,
          identityProof: identityProofUrl,
          vehicleRegistration: vehicleRegistrationUrl,
          vehicleData
      });

      // Save the new demand
      const createdDemande = await newDemande.save();

      const devis = new devisModel({
          partner: req.user.id,
          mission: createdDemande._id,
          status: "Confirmée",
          montant: Number(totalTTC),
          distance: distance,
          remunerationAmount: remunerationAmount
      });
      await devis.save();

      await logActivity("Created New Demande", req.user.id, {
          demandeId: createdDemande._id,
          price: totalTTC,
          distance,
          remunerationAmount,
          identityProofUrl,
          vehicleRegistrationUrl
      });

      res.status(201).json({ message: 'Demande created successfully', demande: createdDemande });
  } catch (error) {
      console.error('Error creating demande:', error);
      await logActivity("Error in createDemandeNewVersion", req.user.id, { error: error.message });

      res.status(500).json({ message: error.message });
  }
};

const deleteDemande = async (req, res) => {
  const demandId = req.params.demandId; // Assuming demandId is provided as a route parameter

  try {
      // Check if the demand exists
      const existingDemande = await demandeModels.findById(demandId);

      if (!existingDemande) {
          await logActivity("Failed to Delete Demande", req.user.id, { reason: "Demande not found", demandId });
          return res.status(404).json({ message: 'Demande not found' });
      }

      // Check if the user making the request is the owner of the demand
      if (existingDemande.user.toString() !== req.user.id) {
          await logActivity("Unauthorized Demande Deletion Attempt", req.user.id, { reason: "Unauthorized access", demandId });
          return res.status(403).json({ message: 'Unauthorized access' });
      }

      // Delete the demand
      await existingDemande.remove();

      await logActivity("Deleted Demande", req.user.id, { demandId });

      res.status(200).json({ message: 'Demande deleted successfully' });
  } catch (error) {
      await logActivity("Error in deleteDemande", req.user.id, { error: error.message });
      res.status(500).json({ message: error.message });
  }
};
const deleteSocket = async (req, res) => {

  const userId = req.params.id;


  try {
      // Find the user by ID
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Delete the NewSocket array
      user.Newsocket = [];
      await user.save();

      return res.status(200).json({ message: 'NewSocket deleted successfully' });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const EmptySocket = async(req, res)=> {
  try {
    const userId = req.user.id;

    // Assuming you have a User model defined using the userSchema
    // const User = require('./path-to-your-user-model'); // Replace with the actual path

    // Find the user by ID
    const user = await userModel.findById(userId);

    if (!user) {
      // If user is not found, send an appropriate response
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear the Newsocket array for the user
    user.Newsocket = [];

    // Save the updated user
    await user.save();

    // Send a success response
    res.status(200).json({ message: 'Socket cleared successfully' });
  } catch (error) {
    // Handle any errors that may occur during the process
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const generateUniqueId = async (contactName) => {
  if (!contactName) return null;

  const parts = contactName.toLowerCase().split(" ");
  const initials = parts.map((word) => word.slice(0, 2)).join(""); // Take first 2 letters
  let baseId = initials.charAt(0).toUpperCase() + initials.slice(1); // Capitalize first letter

  let uniqueId = baseId;
  let counter = 1;

  // Ensure the uniqueId is not duplicated
  while (await User.findOne({ uniqueId })) {
    uniqueId = `${baseId}${counter}`;
    counter++;
  }

  return uniqueId;
};

const RemoveSocketById = async (req, res) => {
  try {
    const userId = req.user.id;
    const socketIdToRemove = req.params.id;

    // Assuming you have a User model defined using the userSchema
    // const User = require('./path-to-your-user-model'); // Replace with the actual path

    // Find the user by ID
    const user = await userModel.findById(userId);

    if (!user) {
      // If user is not found, send an appropriate response
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove the specified socket from the Newsocket array
    user.Newsocket = user.Newsocket.filter((socket) => socket?._id?.toString() !== socketIdToRemove);

    // Save the updated user
    await user.save();

    // Send a success response
    res.status(200).json({ message: 'Socket removed successfully' });
  } catch (error) {
    // Handle any errors that may occur during the process
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const findAllPartnersAndTheirDemands = async (req, res) => {
  try {
    // Find all partners
    const partners = await User.find({ role: 'PARTNER' }).populate("driver");

    // Find demands for each partner
    const partnerDemands = await Promise.all(
      partners.map(async (partner) => {
        const demands = await demandeModels.find({ user: partner._id }).populate("driver");
        return { partner, demands };
      })
    );

    return res.status(200).json(partnerDemands);
  } catch (error) {
    console.error('Error finding partners and their demands:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
const findAllPartnersAndTheirFactures = async (req, res) => {
  try {
    // Find all partners
    const partners = await User.find({ role: 'PARTNER' }).populate("driver");

    // Find demands for each partner
    const partnerDemands = await Promise.all(
      partners.map(async (partner) => {
        const facture = await factureModel.find({ partner: partner._id }).populate("driver");
        return { partner, facture };
      })
    );

    return res.status(200).json(partnerDemands);
  } catch (error) {
    console.error('Error finding partners and their demands:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const findAllDriversAndTheirFactures = async (req, res) => {
  try {
    // Find all partners
    const partners = await User.find({ role: 'DRIVER' }).populate("factures");

    // Find demands for each partner
    const partnerDemands = await Promise.all(
      partners.map(async (partner) => {
        const facture = await DriverFactureModel.find({ driver: partner._id }).populate("factures");
        const facturesArray = facture.map(item => item); // Extract the factures array
        return { partner, facture: facturesArray };
      })
    );

    return res.status(200).json(partnerDemands);
  } catch (error) {
    console.error('Error finding partners and their demands:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
const findDriveFactureById = async (req, res) => {
  try {

      const facture = await DriverFactureModel.findById(req.params.id).populate({
        path: 'factures',
        populate: { path: 'mission' } // Populate the 'mission' field in the 'factures' array
      }).populate("driver");

      return res.status(200).json(facture);


  } catch (error) {
    console.error('Error finding partners and their demands:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const GetFactureById = async (req, res) => {
  try {

    const facture = await factureModel.findById(req.params.id).populate("mission").populate("partner");

    return res.status(200).json(facture);

  } catch (error) {
    console.error('Error finding partners and their demands:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const findDemandsByUserId = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id

  try {
    const demands = await demandeModels.find({ user: userId }).populate("driver");

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
      .populate('user').populate("driver") // Populate the 'user' field to get user details
      .exec();

    // Filter demands created by users with the role 'partner'
    const partnerDemands = allDemands.filter(demand => demand.user && demand.user.role === 'PARTNER');

    res.status(200).json({ demands: partnerDemands });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const findDemandsstatisticsByPartner = async (req, res) => {
  try {
    // Get the current date
    const currentDate = new Date();
    // Get the first and last day of the current month
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Fetch all demands created within the current month
    const allDemands = await demandeModels.find({
      // createdAt: {
      //   $gte: firstDayOfMonth,
      //   $lte: lastDayOfMonth
      // }
    })
      .populate('user')
      .populate('driver') // Populate the 'user' and 'driver' fields to get their details
      .exec();

    // Filter demands created by users with the role 'partner'
    const partnerDemands = allDemands.filter(demand => demand.user && demand.user.role === 'PARTNER');

    // Filter demands by status
    const inProgressDemands = partnerDemands.filter(demand => demand.status === 'in progress');
    const completedDemands = partnerDemands.filter(demand => demand.status === 'Terminée');

    // Get statistics
    const statistics = {
      total: partnerDemands.length,
      inProgress: inProgressDemands.length,
      completed: completedDemands.length,
    };

    res.status(200).json({ demands: partnerDemands, statistics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const findDemandsstatisticsAdmin = async (req, res) => {
  try {
    // Extract filter parameters from the query string
    const { startDate, endDate, status } = req.query;

    // Initialize filters object
    const filters = {};

    // Validate dates and apply date filter only if valid dates are provided
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isNaN(start) && !isNaN(end)) {
      filters.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // Apply status filter if provided
    if (status) {
      filters.status = status;
    }

    // Fetch demands based on filters
    const allDemands = await demandeModels
      .find(filters)
      .populate("user")
      .populate("driver") // Populate 'user' and 'driver' fields
      .exec();

    // Filter demands by status for additional statistics
    const inProgressCount = await demandeModels.countDocuments({
      ...filters,
      status: "in progress",
    });

    const completedCount = await demandeModels.countDocuments({
      ...filters,
      status: "Terminée",
    });

    // Prepare statistics
    const statistics = {
      total: allDemands.length,
      inProgress: inProgressCount,
      completed: completedCount,
    };




    // Send response
    res.status(200).json({ demands: allDemands, statistics });
  } catch (error) {
    console.error("Error fetching demand statistics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



const checkDriverDocumentIsCompleted = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find the driver documents for the user
    const driverDocuments = await DriverDocuments.findOne({ user: userId });

    if (!driverDocuments) {
      return res.status(404).json({ message: "Driver documents not found for the user" });
    }

    // Check if all required fields are present
    const isComplete =
      driverDocuments.assurance &&
      driverDocuments.CinfrontCard &&
      driverDocuments.CinbackCard &&
      driverDocuments.permisConduirefrontCard &&
      driverDocuments.kbis &&
      driverDocuments.permisConduirebackCard &&
      driverDocuments.proofOfAddress;

    if (!isComplete) {
      return res.status(400).json({ message: "Oops! Merci de compléter vos documents de conducteur" });
    }

    if(driverDocuments.refus) {
      return res.status(400).json({ message: "Oops! Vos documents ont été refusés par l'administrateur",
      raison: driverDocuments.raisonRefus
     });
    }
    // Check if the documents are verified
    if (driverDocuments.verified) {
      return res.status(200).json({ message: "Driver documents are complete and verified",
      driverIsVerified:true
     });
    } else {
      return res.status(403).json({ message: "Vos documents sont en cours de vérification par l'administrateur" });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteAllSocketByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Assuming your user model is named 'User'
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear the 'Newsocket' array for the user
    user.Newsocket = [];

    // Save the updated user object
    await user.save();

    return res.status(200).json({ message: 'All sockets deleted successfully' });
  } catch (error) {
    console.error('Error deleting sockets:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const findDevisByPartner = async (req, res)=> {
  const userId = req.user.id; // Assuming user ID is available in req.user.id

  try {
    const devis = await devisModel.find({ partner: userId })
  .populate({
    path: 'mission',
    populate: {
      path: 'driver',
    }
  })
  .populate('categorie');

    if (devis.length > 0) {
      res.status(200).json({ devis });
    } else {
      res.status(404).json({ message: 'No devis found for the user.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

const findDevisByPartnerId = async (req, res) => {
  const userId = req.params.id; // Assuming user ID is available in req.user.id
  const { fromDate, toDate } = req.body; // Extracting fromDate and toDate from query parameters

  try {
    let statusValues = ['Confirmée', 'Affectée', 'En retard', 'Démarrée', 'Terminée',"Confirmée driver"];
    let query = { partner: userId, status: { $in: statusValues },  $or: [{ factureIncluded: false }, { factureIncluded: { $exists: false } }]  };

    // If fromDate and toDate are provided, add date filter to the query
    if (fromDate && toDate && fromDate !== 'Invalid Date' && toDate !== 'Invalid Date') {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      if (!isNaN(from.valueOf()) && !isNaN(to.valueOf())) {
        // Assuming 'createdAt' is the field in the schema where the date is stored
        query.createdAt = { $gte: from, $lte: to };
      } else {
        res.status(400).json({ message: 'Format de date invalide dans les paramètres de la demande.' });
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


    if (devis.length > 0) {
      res.status(200).json({ devis });

    } else {
      res.status(404).json({ message: "Aucun devis trouvé pour l'utilisateur dans la plage de dates spécifiée." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Assurez-vous d'avoir sélectionné le partenaire" });
  }
};


const findDevisById = async (req, res)=> {
  const devisId = req.params.id;

  try {

    const devis = await devisModel.findById(devisId).populate("mission").populate("categorie");

    if (devis) {
      res.status(200).json({ devis });
    } else {
      res.status(404).json({ message: 'No devis found for the user.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

const AccepteDevis = async (req, res) => {
  const devisId = req.params.id;

  try {
      const devis = await devisModel.findById(devisId);

      if (devis) {
          devis.status = "Accepted";
          await devis.save();

          await logActivity("Accepted Devis", req.user.id, { devisId, status: devis.status });

          res.status(200).json({ message: 'Devis accepted successfully', devis });
      } else {
          await logActivity("Failed to Accept Devis", req.user.id, { reason: "No devis found", devisId });

          res.status(404).json({ message: 'No devis found for the user.' });
      }
  } catch (error) {
      console.error(error);
      await logActivity("Error in AccepteDevis", req.user.id, { error: error.message, devisId });

      res.status(500).json({ message: 'Internal Server Error' });
  }
};

const RejeteDevis = async (req, res) => {
  const devisId = req.params.id;

  try {
      const devis = await devisModel.findById(devisId);

      if (devis) {
          devis.status = "refusée";
          await devis.save();

          await logActivity("Rejected Devis", req.user.id, { devisId, status: devis.status });

          res.status(200).json({ message: 'Devis rejected successfully', devis });
      } else {
          await logActivity("Failed to Reject Devis", req.user.id, { reason: "No devis found", devisId });

          res.status(404).json({ message: 'No devis found for the user.' });
      }
  } catch (error) {
      console.error(error);
      await logActivity("Error in RejeteDevis", req.user.id, { error: error.message, devisId });

      res.status(500).json({ message: 'Internal Server Error' });
  }
};

const findDemandById = async (req, res) => {
  const demandId = req.params.demandId;

  try {
    const demande = await demandeModels
      .findById(demandId)
      .populate('driver')
      .populate('user')

      const devis = await devisModel.find({ mission: demandId }).populate("categorie")

    if (demande.user && demande.user.contactName) {
      // Fetch all Devis where partner is equal to demande.user._id
      const devisList = await devisModel.find({ partner: demande.user._id }).populate("partner").populate("mission");

      res.status(200).json({ demande, devisList, devis });
    } else {
      // If demande.user is null or contactName is null, still return demande
      res.status(200).json({ demande,devisList:[], devis  });
    }
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

const AccepteMission = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id
  const demandId = req.params.demandId;

  try {
      // Find the demand by ID and user ID
      const demand = await devisModel.findOne({ _id: demandId });
      const mission = await demandeModels.findOne({ _id: demand?.mission._id });

      // Check if the mission is already taken by another driver
      if (mission?.driver && mission.driver !== userId) {
          await logActivity("Failed to Accept Mission", userId, { reason: "Mission already taken", demandId });
          return res.status(400).json({ message: 'Mission déjà prise par un autre conducteur.' });
      }

      // Check if the driver already has an active mission
      const existingStartedMission = await demandeModels.findOne({ driver: userId, status: 'Démarrée' });

      if (existingStartedMission) {
          await logActivity("Failed to Accept Mission", userId, { reason: "User already has an active mission", demandId });
          return res.status(400).json({ message: 'Vous avez déjà une mission en cours.' });
      }

      if (!demand) {
          await logActivity("Failed to Accept Mission", userId, { reason: "Demand not found", demandId });
          return res.status(404).json({ message: 'Demande non trouvée.' });
      }

      // Assign the driver if not already assigned
      if (!mission?.driver) {
          mission.driver = userId;
      }

      // Upload images to Cloudinary
      const uploadFileToCloudinary = async (file, folderName) => {
          if (file) {
              const result = await cloudinary.uploader.upload(file?.path, {
                  resource_type: 'auto',
                  folder: folderName,
                  public_id: `${folderName}_${Date.now()}`,
                  overwrite: true,
              });
              return result.secure_url;
          }
          return null;
      };

      const imagesUploaded = [];

      await Promise.all(
          Object.values(req?.files || {}).map(async (file) => {
              try {
                  const uploadedUrl = await uploadFileToCloudinary(file, `mission:${demandId}`);
                  imagesUploaded.push(uploadedUrl);
              } catch (error) {
                  console.error("Error uploading file to Cloudinary:", error);
                  throw error;
              }
          })
      );

      // Set mission status to "Démarrée" and save images
      demand.status = "Démarrée";
      mission.status = "Démarrée";

      if (Array.isArray(imagesUploaded) && imagesUploaded.every(url => typeof url === 'string')) {
          mission.demareeMissionImages = imagesUploaded;
      } else {
          console.error('Invalid image data format');
          await logActivity("Failed to Accept Mission", userId, { reason: "Invalid image format", demandId });
          return res.status(400).json({ message: 'Format d\'image invalide' });
      }

      mission.demareeMissionCmnt = req.body.demareeMissionCmnt;

      // Save the updated demand and mission
      const updatedDemand = await demand.save();
      const updatedMission = await mission.save();

      await logActivity("Accepted Mission", userId, { demandId, missionId: mission._id, status: "Démarrée", imagesUploaded });

      res.status(200).json({ message: 'Mission acceptée avec succès.', demand: updatedDemand });
  } catch (error) {
      console.error(error);
      await logActivity("Error in AccepteMission", userId, { error: error.message, demandId });
      res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

const getMissionById = async (req, res) => {
  try {
      const missionId = req.params.id; // Assuming you pass the mission ID as a URL parameter
      const mission = await DemandeModel.findById(missionId)
          .populate('user') // Add the fields you want to populate here
          .populate('driver'); // Adjust according to your User schema

      if (!mission) {
          return res.status(404).json({ message: 'Mission not found' });
      }

      res.json(mission);
  } catch (error) {
      console.error('Error fetching mission:', error);
      res.status(500).json({ message: 'Error fetching mission' });
  }
};

const updateFieldsForDevis = async (req, res) => {
  try {
      // Find the user by ID
      const user = await userModel.findById(req.user.id);

      if (!user) {
          await logActivity("Failed to Update User Fields", req.user.id, { reason: "User not found" });
          return res.status(404).json({ message: 'User not found' });
      }

      // Define fields to update
      const fieldsToUpdate = ['VAT', 'name', 'email', 'addressPartner', 'phoneNumber'];
      const updatedFields = {};

      fieldsToUpdate.forEach((field) => {
          if (req.body[field] !== undefined) {
              user[field] = req.body[field];
              updatedFields[field] = req.body[field]; // Store updated fields for logging
          }
      });

      // Save the updated user
      await user.save();

      await logActivity("Updated User Fields for Devis", req.user.id, updatedFields);

      res.json({
          message: 'User details updated successfully',
          user // Or return only updated fields if preferred
      });

  } catch (error) {
      await logActivity("Error in updateFieldsForDevis", req.user.id, { error: error.message });

      res.status(500).json({
          message: 'Error updating user details',
          error: error.message
      });
  }
};

const TermineeMission = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id
  const demandId = req.params.demandId; // Assuming you pass the demandId in the request parameters

  try {
      // Find the demand by ID and user ID
      const demand = await devisModel.findOne({ _id: demandId });
      const mission = await demandeModels.findOne({ _id: demand?.mission._id });

      if (!demand) {
          await logActivity("Failed to Terminate Mission", userId, { reason: "Demand not found", demandId });
          return res.status(404).json({ message: 'Demande non trouvée.' });
      }

      // Assign the driver if not already assigned
      if (!mission?.driver) {
          mission.driver = userId;
      }

      // Upload images to Cloudinary
      const uploadFileToCloudinary = async (file, folderName) => {
          if (file) {
              const result = await cloudinary.uploader.upload(file?.path, {
                  resource_type: 'auto',
                  folder: folderName,
                  public_id: `${folderName}_${Date.now()}`,
                  overwrite: true,
              });
              return result.secure_url;
          }
          return null;
      };

      const imagesUploaded = [];

      await Promise.all(
          Object.values(req?.files || {}).map(async (file) => {
              try {
                  const uploadedUrl = await uploadFileToCloudinary(file, `mission:${demandId}`);
                  imagesUploaded.push(uploadedUrl);
              } catch (error) {
                  console.error("Error uploading file to Cloudinary:", error);
                  throw error;
              }
          })
      );

      // Update mission status
      demand.status = "Terminée";
      mission.status = "Terminée";

      // Create a new invoice for the mission
      const newFacture = new factureModel({
          partner: mission?.driver,
          totalAmmount: demand?.remunerationAmount,
          mission: mission._id
      });

      // Ensure images are correctly formatted
      if (Array.isArray(imagesUploaded) && imagesUploaded.every(url => typeof url === 'string')) {
          mission.termineemissionImages = imagesUploaded;
      } else {
          console.error('Invalid image data format');
          await logActivity("Failed to Terminate Mission", userId, { reason: "Invalid image format", demandId });
          return res.status(400).json({ message: 'Format d\'image invalide' });
      }

      mission.termineeMissionCmnt = req.body.termineeMissionCmnt;
      const createdFacture = await newFacture.save();

      // Save updates
      const updatedDemand = await demand.save();
      const updatedMission = await mission.save();

      await logActivity("Terminated Mission", userId, {
          demandId,
          missionId: mission._id,
          status: "Terminée",
          imagesUploaded,
          factureId: createdFacture._id
      });

      res.status(200).json({ message: 'Mission terminée avec succès.', demand: updatedDemand });
  } catch (error) {
      console.error(error);
      await logActivity("Error in TermineeMission", userId, { error: error.message, demandId });

      res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

const ConfirmeMissionByDriver = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id
  const demandId = req.params.demandId; // Assuming demandId is passed in request parameters

  try {
      // Find the demand and mission
      const demand = await devisModel.findOne({ _id: demandId });
      const mission = await demandeModels.findOne({ _id: demand?.mission._id });

      if (!demand) {
          await logActivity("Failed to Confirm Mission", userId, { reason: "Demand not found", demandId });
          return res.status(404).json({ message: 'Demande non trouvée.' });
      }

      // Assign the driver if not already assigned
      if (!mission?.driver) {
          mission.driver = userId;
      } else if (mission.status === "Confirmée driver") {
          await logActivity("Failed to Confirm Mission", userId, { reason: "Mission already confirmed by another driver", demandId });
          return res.status(400).json({ message: 'Mission déjà prise par un autre conducteur.' });
      }

      // Update mission status
      demand.status = "Confirmée driver";
      mission.status = "Confirmée driver";

      const updatedDemand = await demand.save();
      const updatedMission = await mission.save();

      await logActivity("Mission Confirmed by Driver", userId, {
          demandId,
          missionId: mission._id,
          status: "Confirmée driver"
      });

      res.status(200).json({ message: 'Mission confirmée avec succès.', demand: updatedDemand });
  } catch (error) {
      console.error(error);
      await logActivity("Error in ConfirmeMissionByDriver", userId, { error: error.message, demandId });

      res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

const RefuseMission = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id
  const demandId = req.params.demandId; // Assuming you pass the demandId in the request parameters

  try {
      // Find the demand by ID
      const demand = await demandeModels.findOne({ _id: demandId });

      if (!demand) {
          await logActivity("Failed to Reject Mission", userId, { reason: "Demand not found", demandId });
          return res.status(404).json({ message: 'Demande non trouvée.' });
      }

      // Update demand status to "rejected"
      demand.status = "rejected";

      // Save the updated demand
      const updatedDemand = await demand.save();

      await logActivity("Mission Rejected", userId, { demandId, status: "rejected" });

      res.status(200).json({ message: 'Mission refusée avec succès.', demand: updatedDemand });
  } catch (error) {
      console.error(error);
      await logActivity("Error in RefuseMission", userId, { error: error.message, demandId });

      res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};
const CompleteMission = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user.id
  const demandId = req.params.demandId; // Assuming you pass the demandId in the request parameters

  try {
      // Find the demand by ID
      const demand = await demandeModels.findOne({ _id: demandId });

      if (!demand) {
          await logActivity("Failed to Complete Mission", userId, { reason: "Demand not found", demandId });
          return res.status(404).json({ message: 'Demande non trouvée.' });
      }

      // Update demand status to "Completed"
      demand.status = "Completed";

      // Save the updated demand
      const updatedDemand = await demand.save();

      await logActivity("Mission Completed", userId, { demandId, status: "Completed" });

      res.status(200).json({ message: 'Mission complétée avec succès.', demand: updatedDemand });
  } catch (error) {
      console.error(error);
      await logActivity("Error in CompleteMission", userId, { error: error.message, demandId });

      res.status(500).json({ message: 'Erreur interne du serveur.' });
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


let responseSent = false;
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
            driverIsVerified:user.driverIsVerified,
            firstLoginByThirdParty:user.firstLoginByThirdParty,
            // siret:user.siret,
            // newsocket:user.Newsocket ? user.Newsocket : [],


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

      return res.status(500).json({success:false, message: "error" });
    }
  }

}
const refreshAuthToken = (req, res) => {
  try {
    // Extract the user object from the authenticated request
    const user = req.user;


    // Generate a new token with user details
    const newToken = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        profile: user.profile,
        isBlocked: user.isBlocked,
        onligne: user.onligne,
        firstLogin: user.firstLogin,
        driverIsVerified: user.driverIsVerified,
        firstLoginByThirdParty: user.firstLoginByThirdParty,
      },
      process.env.SECRET_KEY,
      { expiresIn: Number.MAX_SAFE_INTEGER} // Set a reasonable expiration time
    );

    // Send the new token to the client
    return res.status(200).json({ success: true, token: "Bearer " + newToken });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

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

      return res.status(500).json({ success: false, message: "error" });
    }
  }
};

const registerUser = asyncHandler(async (req, res, next) => {

  const { errors, isValid } = validateRegisterInput(req.body)
  const {avatar} = req.body;



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
              firstLogin: req.body.firstLogin


            })

            const OTP = generateOTP()
            const verificationToken = new verificationTokenModels({
              owner: user._id,
              token: OTP
            })
            await verificationToken.save()
              .then(token => {

              })
              .catch(err => {

              })

            mailer.send({
              to: ["zbousnina@yahoo.com",user.email ],
              subject: "Verification code",
              html: generateEmailTemplate(OTP)
            }, (err)=>{

            })

            user.save()
              .then(user => {
                if(req.body.role==="MUNICIPAL" || req.body.role=== "PRIVATE_COMPANY"){

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

                res.status(500).json({ success:false, message: "error" })
              })

          }
        })
    }



  } catch (error) {
    res.status(500).json({ message: error })


  }
})

const AddPartner = asyncHandler(async (req, res, next) => {
  const { errors, isValid } = PartnerValidationInput(req.body);
  const { kbis } = req.files;

  try {
      if (!isValid) {
          await logActivity("Failed to Add Partner", req.user.id, { reason: "Validation failed", errors });
          return res.status(404).json(errors);
      }

      let responseSent = false;

      // Check if email already exists
      const existingEmailUser = await User.findOne({ email: req.body.email });
      if (existingEmailUser) {
          errors.email = "Email already exists";
          await logActivity("Failed to Add Partner", req.user.id, { reason: "Email already exists", email: req.body.email });
          responseSent = true;
          return res.status(400).json(errors);
      }

      // Check if SIRET number already exists
      const existingSiretUser = await User.findOne({ siret: req.body.siret });
      if (existingSiretUser) {
          errors.siret = "This SIREN/SIRET already exists";
          await logActivity("Failed to Add Partner", req.user.id, { reason: "SIRET already exists", siret: req.body.siret });
          responseSent = true;
          return res.status(400).json(errors);
      }

      // Check if phone number already exists
      const existingPhoneNumberUser = await User.findOne({ phoneNumber: req.body.phoneNumber });
      if (existingPhoneNumberUser) {
          errors.phoneNumber = "Phone number already exists";
          await logActivity("Failed to Add Partner", req.user.id, { reason: "Phone number already exists", phoneNumber: req.body.phoneNumber });
          responseSent = true;
          return res.status(400).json(errors);
      }

      if (!responseSent) {
          if (kbis) {
              const result = await cloudinary.uploader.upload(kbis.path, {
                  resource_type: "auto",
                  folder: "pdf_uploads",
                  public_id: `kbis_${Date.now()}`,
                  overwrite: true,
              });

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
              firstLogin: true,
          });

          await profileModels.create({
              user: user._id,
              tel: req.body.phoneNumber,
          });

          mailer.send({
              to: ["zbousnina@yahoo.com", user.email],
              subject: "Welcome to Convoyage! Your Account Details Inside",
              html: generateEmailTemplatePartner(user.contactName, user.name, user.email, GeneratedPassword),
          }, (err) => {});

          user.save()
              .then(async (savedUser) => {
                  await logActivity("Partner Added Successfully", req.user.id, {
                      partnerId: savedUser._id,
                      email: savedUser.email,
                      phoneNumber: savedUser.phoneNumber,
                      siret: savedUser.siret
                  });

                  res.status(200).json({ success: true, user: savedUser, msg: "An email has been sent to your registered email address." });
              })
              .catch(async (err) => {
                  console.error(err);
                  await logActivity("Error in AddPartner", req.user.id, { error: err.message });
                  res.status(500).json({ success: false, message: "Error" });
              });
      }
  } catch (error) {
      console.error(error);
      await logActivity("Error in AddPartner", req.user.id, { error: error.message });
      res.status(500).json({ message: error.message });
  }
});
const Register = asyncHandler(async (req, res, next) => {
  const { errors, isValid } = PartnerValidationInput(req.body);
  const { kbis } = req.files;


  try {
    if (!isValid) {

      return res.status(404).json(errors);
    }

    let responseSent = false;

    // Vérifier si l'email existe déjà
    const existingEmailUser = await User.findOne({ email: req.body.email });
    if (existingEmailUser) {
      errors.email = "Cet email existe déjà.";
      responseSent = true;
      return res.status(400).json(errors);
    }

    // Vérifier si le numéro SIRET existe déjà
    const existingSiretUser = await User.findOne({ siret: req.body.siret });
    if (existingSiretUser) {
      errors.siret = "Ce numéro SIRET/SIREN existe déjà.";
      responseSent = true;
      return res.status(400).json(errors);
    }

    // Vérifier si le numéro de téléphone existe déjà
    const existingPhoneNumberUser = await User.findOne({ phoneNumber: req.body.phoneNumber });
    if (existingPhoneNumberUser) {
      errors.phoneNumber = "Ce numéro de téléphone existe déjà.";
      responseSent = true;
      return res.status(400).json(errors);
    }

    if (!responseSent) {
      if (kbis) {
        const result = await cloudinary.uploader.upload(kbis.path, {
          resource_type: "auto",
          folder: "pdf_uploads",
          public_id: `kbis_${Date.now()}`,
          overwrite: true,
        });

        req.body.kbis = result.secure_url;
      }

      const user = await new User({
        name: req.body.name,
        addressPartner: req.body.addressPartner,
        contactName: req.body.contactName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: bcrypt.hashSync(req.body.password, 10), // Use password sent from the front end
        role: "PARTNER",
        verified: true,
        siret: req.body.siret,
        kbis: req.body.kbis,
        firstLogin: true,
      });
      await profileModels.create({
        user: user._id,
        // avatar: profile.picture,
        tel:  req.body.phoneNumber,
    });

      mailer.send(
        {
          to: ["zbousnina@yahoo.com", user.email],
          subject: "Bienvenue chez Convoyage ! Détails de votre compte à l'intérieur",
          html: generateEmailTemplatePartner(
            user.contactName,
            user.name,
            user.email,
            user.role !== "PARTNER" ? req.body.password : "" // Exclude password if role is "PARTNER"
          ),
        },
        (err) => {
          if (err) console.error("Erreur d'envoi de l'email :", err);
        }
      );

      user
        .save()
        .then((savedUser) => {
          res.status(200).json({
            success: true,
            user: savedUser,
            msg: "Un email a été envoyé à votre adresse email enregistrée.",
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ success: false, message: "Erreur interne." });
        });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Une erreur interne est survenue." });
  }
});
const updateTrancheConfiguration = async (req, res) => {
  try {
      const { id } = req.params;
      const { tranches, price } = req.body;

      // Find the mission request
      let demande = await DemandeModel.findById(id);
      if (!demande) {
          await logActivity("Failed to Update Tranche Configuration", req.user.id, { reason: "Mission request not found", demandeId: id });
          return res.status(404).json({ message: "Mission request not found" });
      }

      // Update price
      demande.price = price;

      // Update tranches if provided
      if (tranches && Array.isArray(tranches)) {
          demande.tranches = tranches;
      }

      // Recalculate remuneration based on distance and new tranches
      if (demande.distance && !isNaN(demande.distance)) {
          const distance = Number(demande.distance);

          if (demande.tranches.length > 0) {
              const matchingTranche = demande.tranches.find(tranche =>
                  distance >= tranche.min && distance <= tranche.max
              );

              demande.remunerationAmount = matchingTranche ? matchingTranche.remuneration : 0;
          } else {
              demande.remunerationAmount = demande.price; // Default to fixed price if no tranches
          }
      }

      // Save the updated mission request
      await demande.save();

      await logActivity("Updated Tranche Configuration", req.user.id, {
          demandeId: id,
          price,
          tranches,
          remunerationAmount: demande.remunerationAmount
      });

      return res.status(200).json({ message: "Tranche configuration updated", demande });
  } catch (error) {
      console.error("Error updating tranche configuration:", error);
      await logActivity("Error in updateTrancheConfiguration", req.user.id, { error: error.message });

      return res.status(500).json({ message: "Server error" });
  }
};
const CompletePartnerProfile = asyncHandler(async (req, res, next) => {
  const { errors, isValid } = partnerCompleteProfileValidation(req.body);
  const { kbis } = req.files || {};
  const userId = req.user.id; // Authenticated user's ID from Passport

  try {
      if (!isValid) {
          await logActivity("Failed to Complete Partner Profile", userId, { reason: "Validation failed", errors });
          return res.status(404).json(errors);
      }

      const user = await User.findById(userId);
      if (!user) {
          await logActivity("Failed to Complete Partner Profile", userId, { reason: "User not found" });
          return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // Check if phone number already exists
      const existingPhoneNumberUser = await User.findOne({ phoneNumber: req.body.phoneNumber, _id: { $ne: userId } });
      if (existingPhoneNumberUser) {
          errors.phoneNumber = "Ce numéro de téléphone est déjà utilisé.";
          await logActivity("Failed to Complete Partner Profile", userId, { reason: "Phone number already exists", phoneNumber: req.body.phoneNumber });
          return res.status(400).json(errors);
      }

      // Check if SIRET number already exists
      if (req.body.siret) {
          const existingSiretUser = await User.findOne({ siret: req.body.siret, _id: { $ne: userId } });
          if (existingSiretUser) {
              errors.siret = "Ce numéro SIRET/SIREN est déjà utilisé.";
              await logActivity("Failed to Complete Partner Profile", userId, { reason: "SIRET already exists", siret: req.body.siret });
              return res.status(400).json(errors);
          }
      }

      // Upload KBIS if provided
      if (kbis) {
          const result = await cloudinary.uploader.upload(kbis.path, {
              resource_type: "auto",
              folder: "pdf_uploads",
              public_id: `kbis_${Date.now()}`,
              overwrite: true,
          });
          req.body.kbis = result.secure_url;
      }

      // Update partner profile
      user.name = req.body.name || user.name;
      user.contactName = req.body.contactName || user.contactName;
      user.addressPartner = req.body.addressPartner || user.addressPartner;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.siret = req.body.siret || user.siret;
      user.kbis = req.body.kbis || user.kbis;
      user.firstLoginByThirdParty = false;

      const updatedUser = await user.save();

      await logActivity("Partner Profile Updated", userId, {
          name: user.name,
          phoneNumber: user.phoneNumber,
          siret: user.siret,
          kbis: user.kbis
      });

      res.status(200).json({
          success: true,
          user: updatedUser,
          msg: "Profil mis à jour avec succès.",
      });
  } catch (error) {
      console.error(error);
      await logActivity("Error in CompletePartnerProfile", userId, { error: error.message });

      res.status(500).json({ message: "Une erreur interne est survenue." });
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
          await logActivity("Failed to Update Partner", req.user.id, { reason: "Email already in use", email: newEmail });
          return res.status(400).json({ success: false, message: "The new email already exists in another account." });
      }

      const existingPartner = await User.findById(partnerId);

      if (!existingPartner) {
          await logActivity("Failed to Update Partner", req.user.id, { reason: "Partner not found", partnerId });
          return res.status(404).json({ success: false, message: "Partner not found." });
      }

      // Generate a new password
      const newGeneratedPassword = generateRandomPassword();

      // Update partner fields
      existingPartner.name = req.body.name || existingPartner.name;
      existingPartner.addressPartner = req.body.addressPartner || existingPartner.addressPartner;
      existingPartner.contactName = req.body.contactName || existingPartner.contactName;
      existingPartner.email = newEmail || existingPartner.email;
      existingPartner.phoneNumber = req.body.phoneNumber || existingPartner.phoneNumber;
      existingPartner.password = bcrypt.hashSync(newGeneratedPassword, 10);
      existingPartner.firstLogin = true;

      // Save the updated partner
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

      await logActivity("Partner Updated Successfully", req.user.id, {
          partnerId,
          email: updatedPartner.email,
          phoneNumber: updatedPartner.phoneNumber,
          address: updatedPartner.addressPartner
      });

      res.status(200).json({
          success: true,
          partner: updatedPartner,
          msg: 'Partner updated successfully. A new email has been sent with your updated account information.'
      });

  } catch (error) {
      console.error(error);
      await logActivity("Error in updatePartner", req.user.id, { error: error.message });
      res.status(500).json({ message: error.message });
  }
});

const updateMission = asyncHandler(async (req, res, next) => {
  try {
      const missionId = req.params.id;
      const existingMission = await DemandeModel.findById(missionId);

      if (!existingMission) {
          await logActivity("Failed to Update Mission", req.user.id, { reason: "Mission not found", missionId });
          return res.status(404).json({ success: false, message: "Mission not found." });
      }

      // Update Mission fields with values from the request body
      const updatedFields = {};
      Object.keys(req.body).forEach((key) => {
          if (key !== 'dateDepart') { // Exclude 'dateDepart' for special handling
              if (req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '') {
                  existingMission[key] = req.body[key];
                  updatedFields[key] = req.body[key];
              }
          } else {
              // Handle 'dateDepart' separately
              existingMission.dateDepart = req.body.dateDepart ? new Date(req.body.dateDepart) : existingMission.dateDepart;
              updatedFields.dateDepart = existingMission.dateDepart;
          }
      });

      // Save the updated Mission
      const updatedMission = await existingMission.save();

      await logActivity("Mission Updated Successfully", req.user.id, {
          missionId,
          updatedFields
      });

      res.status(200).json({
          success: true,
          mission: updatedMission,
          msg: 'Mission updated successfully.'
      });

  } catch (error) {
      console.error(error);
      await logActivity("Error in updateMission", req.user.id, { error: error.message, missionId: req.params.id });

      res.status(500).json({ message: "Internal Server Error." });
  }
});

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

            return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
          }
        }
        );
        res.status(200).json({ OTP: {success:true ,message: "OTP sent" }});
    }
  } catch (error) {

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

            return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
          }
        }
        );
        res.status(200).json({ OTP: {success:true ,message: "OTP sent" }});
    }
  } catch (error) {

    return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
  }
};

const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

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

      })

  res.status(200).json({success:true, message: "Email verified successfully" });
};

const DeleteAccount = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  if (!userId || !otp.trim()) {
      await logActivity("Failed to Delete Account", userId, { reason: "Invalid request, missing parameters" });
      return sendError(res, "Invalid request, missing parameters!");
  }

  if (!isValidObjectId(userId)) {
      await logActivity("Failed to Delete Account", userId, { reason: "Invalid user ID" });
      return sendError(res, "Invalid user id!");
  }

  const user = await User.findById(userId);
  if (!user) {
      await logActivity("Failed to Delete Account", userId, { reason: "User not found" });
      return sendError(res, "Sorry! User not found!");
  }

  const token = await verificationTokenModels.findOne({ owner: user._id });
  if (!token) {
      await logActivity("Failed to Delete Account", userId, { reason: "OTP token missing" });
      return sendError(res, "Please resend OTP");
  }

  const isMatched = await token.compareToken(otp);
  if (!isMatched) {
      await logActivity("Failed to Delete Account", userId, { reason: "Invalid OTP" });
      return sendError(res, "Please provide a valid token!");
  }

  await verificationTokenModels.findByIdAndDelete(token._id);
  await user.remove();

  mailer.send(
      {
          to: ["zbousnina@yahoo.com", user.email],
          subject: "Account Deleted Successfully",
          html: plainEmailTemplate(
              "Account Deleted Successfully",
              "Your account has been deleted successfully!"
          ),
      },
      (err) => {
          if (err) console.error("Error sending email:", err);
      }
  );

  await logActivity("Account Deleted Successfully", userId, { email: user.email });

  res.status(200).json({ success: true, message: "Account deleted successfully" });
};
const DeleteAccountByAdmin = async (req, res) => {
  const { id } = req.params; // Assuming the user ID is in the URL parameters

  if (!id || !isValidObjectId(id)) {
      await logActivity("Failed to Delete Account", req.user.id, { reason: "Invalid user ID", userId: id });
      return sendError(res, "Invalid user id!");
  }

  try {
      const user = await User.findById(id);

      if (!user) {
          await logActivity("Failed to Delete Account", req.user.id, { reason: "User not found", userId: id });
          return sendError(res, "User not found!");
      }

      // You may want to add additional checks or restrictions here if needed

      await user.remove();

      mailer.send(
          {
              to: ["zbousnina@yahoo.com", user.email],
              subject: "Account Deleted by Admin",
              html: generateDeleteAccountEmailTemplate(user.name, user.email),
          },
          (err) => {
              if (err) {
                  console.error("Error sending email:", err);
              }
          }
      );

      await logActivity("Account Deleted by Admin", req.user.id, { deletedUserId: id, deletedUserEmail: user.email });

      res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
      console.error(error);
      await logActivity("Error in DeleteAccountByAdmin", req.user.id, { error: error.message, userId: id });

      return sendError(res, "Error deleting account");
  }
};

const forgotPassword = async (req, res) => {
  try {


    const { email } = req.body;

    // Validate email existence
    if (!email) {
      return res.status(400).json({ error: "Veuillez fournir une adresse e-mail valide !" });
    }



    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {

      return res.status(404).json({ error: "Désolé ! Utilisateur non trouvé !" });
    }



    // Check if a token already exists for the user
    const existingToken = await resetTokenModels.findOne({ owner: user._id });
    if (existingToken) {

      return res.status(429).json({ error: "Vous avez déjà demandé un code de réinitialisation. Veuillez patienter une heure avant de pouvoir en demander un nouveau." });
    }

    // Generate a new token
    const resetToken = await createRandomBytes();

    // Save the token in the database
    const newToken = new resetTokenModels({
      owner: user._id,
      token: resetToken,
    });

    await newToken.save();



    // Send the reset email
    const resetLink = `https://convo-1.netlify.app/reset-password?token=${resetToken}&id=${user._id}`;
    mailer.send(
      {
        to: ["zbousnina@yahoo.com", user.email], // Use only the user's email
        subject: "Demande de réinitialisation de mot de passe",
        html: generatePasswordResetTemplate(resetLink),
      },
      (err) => {
        if (err) {
          console.error("Error sending email:", err);
          return res.status(500).json({ error: "Échec de l'envoi de l'e-mail de réinitialisation. Veuillez réessayer plus tard." });
        }

      }
    );

    // Respond to the user
    return res.status(200).json({ message: "Le lien de réinitialisation du mot de passe a été envoyé à votre adresse e-mail !" });
  } catch (error) {
    console.error("Error in forgotPassword handler:", error);
    return res.status(500).json({ error: "Une erreur interne est survenue. Veuillez réessayer plus tard." });
  }
};

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

      }
    }
  );
  mailer.send({
    to: ["zbousnina@yahoo.com",user.email ],
    subject: "Verification code",
    html: plainEmailTemplate('Password reset successfully', 'Your password has been reset successfully!'),
  }, (err)=>{

  })

  res.status(200).json({ message: 'Password reset successfully', success:true });
};


const getUsers = async (req, res) => {

  try {
      const basicInfo = await User.find({ onligne: true });
      res.status(200).json({ users:basicInfo})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};
const getUsersById = async (req, res) => {

  try {
      const basicInfo = await User.findById(req.user.id);
      res.status(200).json({ user:basicInfo})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};
const getAllPartner = async (req, res) => {

  try {
      const partner = await User.find({ role: "PARTNER" });
      res.status(200).json({ partner})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};
const getAllDriver = async (req, res) => {

  try {
      const driver = await User.find({ role: "DRIVER",verified: true });
      res.status(200).json({ driver})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};
const getPartnerById = async (req, res) => {

  try {
      const partner = await User.findById(req.params.id);
      const documents = await DriverDocuments.find({user:req.params.id})

      res.status(200).json({ partner, documents})
      // return basicInfo;
  } catch (error) {
      res.status(500).json({message1: "error2", message: error.message})
  }
};



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




const getUserByEmail = async (req, res) => {
  const { email } = req.params

  try {
    const user = await User.findOne({ email: email })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error) {

    res.status(500).json({ message: 'Server error' })
  }
}


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


const AddDriver = asyncHandler(async (req, res, next) => {
  const { errors, isValid } = DriverValidationInput(req.body);

  const {
      assurance,
      CinfrontCard,
      CinbackCard,
      permisConduirefrontCard,
      permisConduirebackCard,
      proofOfAddress,
      avatar,
      kbis
  } = req.files;

  try {
      if (!isValid) {
          await logActivity("Failed to Add Driver", req.user.id, { reason: "Validation failed", errors });
          return res.status(404).json(errors);
      }

      const existingUser = await User.findOne({ email: req.body.email });

      if (existingUser) {
          await logActivity("Failed to Add Driver", req.user.id, { reason: "Email already exists", email: req.body.email });
          return res.status(404).json({ success: false, email: "Email already exists" });
      }

      const generatedPassword = generateRandomPassword();
      const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: bcrypt.hashSync(generatedPassword, 10),
          role: "DRIVER",
          verified: true,
      });

      const user = await newUser.save();
      const uploadFileToCloudinary = async (file, folderName) => {
          if (file) {
              const result = await cloudinary.uploader.upload(file.path, {
                  resource_type: "auto",
                  folder: folderName,
                  public_id: `${folderName}_${Date.now()}`,
                  overwrite: true,
              });

              return result.secure_url;
          }
          return null;
      };

      const driverDocuments = new DriverDocuments({
          user: user._id,
          assurance: await uploadFileToCloudinary(assurance, "assurance_uploads"),
          CinfrontCard: await uploadFileToCloudinary(CinfrontCard, "cin_uploads"),
          CinbackCard: await uploadFileToCloudinary(CinbackCard, "cin_uploads"),
          permisConduirefrontCard: await uploadFileToCloudinary(permisConduirefrontCard, "permis_uploads"),
          permisConduirebackCard: await uploadFileToCloudinary(permisConduirebackCard, "permis_uploads"),
          proofOfAddress: await uploadFileToCloudinary(proofOfAddress, "address_uploads"),
          kbis: await uploadFileToCloudinary(kbis, "address_uploads"),
          avatar: await uploadFileToCloudinary(avatar, "avatar_uploads"),
      });

      await driverDocuments.save();

      // Send an email to the driver
      mailer.send(
          {
              to: ["zbousnina@yahoo.com", user.email],
              subject: "Welcome to Convoyage! Your Account Details Inside",
              html: generateEmailTemplateDriver(user.name, user.email, generatedPassword),
          },
          (err) => {
              if (err) {
                  console.error("Error sending email:", err);
              }
          }
      );

      await logActivity("Driver Added Successfully", req.user.id, {
          driverId: user._id,
          email: user.email,
          name: user.name
      });

      return res.status(200).json({
          success: true,
          user,
          msg: "An email has been sent to your registered email address.",
      });
  } catch (error) {
      console.error(error);
      await logActivity("Error in AddDriver", req.user.id, { error: error.message });

      return res.status(500).json({ message: error.message });
  }
});
const AddDriverDoc_DriverLicence = asyncHandler(async (req, res, next) => {
  const {
      assurance,
      CinfrontCard,
      CinbackCard,
      permisConduirefrontCard,
      permisConduirebackCard,
      proofOfAddress,
      avatar,
      kbis
  } = req.files;

  try {
      const uploadFileToCloudinary = async (file, folderName) => {
          if (file) {
              const result = await cloudinary.uploader.upload(file.path, {
                  resource_type: "auto",
                  folder: folderName,
                  public_id: `${folderName}_${Date.now()}`,
                  overwrite: true,
              });

              return result.secure_url;
          }
          return null;
      };

      // Find the existing document for the logged-in user
      let driverDocuments = await DriverDocuments.findOne({ user: req.user.id });
      if (!driverDocuments) {
          // If no document found, create a new one
          driverDocuments = new DriverDocuments({ user: req.user.id });
      }

      // Store updated fields
      const updatedFields = {};

      // Update or add new values based on files in req.files
      if (permisConduirefrontCard) {
          driverDocuments.permisConduirefrontCard = await uploadFileToCloudinary(permisConduirefrontCard, "permis_uploads");
          updatedFields.permisConduirefrontCard = driverDocuments.permisConduirefrontCard;
      }
      if (permisConduirebackCard) {
          driverDocuments.permisConduirebackCard = await uploadFileToCloudinary(permisConduirebackCard, "permis_uploads");
          updatedFields.permisConduirebackCard = driverDocuments.permisConduirebackCard;
      }
      if (assurance) {
          driverDocuments.assurance = await uploadFileToCloudinary(assurance, "assurance_uploads");
          updatedFields.assurance = driverDocuments.assurance;
      }
      if (CinfrontCard) {
          driverDocuments.CinfrontCard = await uploadFileToCloudinary(CinfrontCard, "cin_uploads");
          updatedFields.CinfrontCard = driverDocuments.CinfrontCard;
      }
      if (CinbackCard) {
          driverDocuments.CinbackCard = await uploadFileToCloudinary(CinbackCard, "cin_uploads");
          updatedFields.CinbackCard = driverDocuments.CinbackCard;
      }
      if (proofOfAddress) {
          driverDocuments.proofOfAddress = await uploadFileToCloudinary(proofOfAddress, "address_uploads");
          updatedFields.proofOfAddress = driverDocuments.proofOfAddress;
      }
      if (kbis) {
          driverDocuments.kbis = await uploadFileToCloudinary(kbis, "address_uploads");
          updatedFields.kbis = driverDocuments.kbis;
      }

      // Save the document
      await driverDocuments.save();

      await logActivity("Driver Documents Updated", req.user.id, { updatedFields });

      return res.status(200).json({ success: true, msg: "Driver documents updated successfully" });
  } catch (error) {
      console.error(error);
      await logActivity("Error in AddDriverDoc_DriverLicence", req.user.id, { error: error.message });

      return res.status(500).json({ message: error.message });
  }
});

const finDocByDriver = async(req, res)=> {
  try {
    const driverDocuments = await DriverDocuments.findOne({ user: req.user.id });
    res.status(200).json({ driverDocuments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

}


const updateDriver = asyncHandler(async (req, res, next) => {
  try {
      const driverId = req.params.id;
      const newEmail = req.body.email;

      // Check if the new email already exists in another account
      const emailExistsInOtherAccount = await User.findOne({ email: newEmail, _id: { $ne: driverId } });

      if (emailExistsInOtherAccount) {
          await logActivity("Failed to Update Driver", req.user.id, { reason: "Email already exists", email: newEmail });
          return res.status(400).json({ success: false, message: "The new email already exists in another account." });
      }

      const existingDriver = await User.findById(driverId);

      if (!existingDriver) {
          await logActivity("Failed to Update Driver", req.user.id, { reason: "Driver not found", driverId });
          return res.status(404).json({ success: false, message: "Driver not found." });
      }

      // Generate a new password
      const newGeneratedPassword = generateRandomPassword();

      // Update Driver fields
      existingDriver.name = req.body.name || existingDriver.name;
      existingDriver.email = newEmail || existingDriver.email; // Update with the new email
      existingDriver.password = bcrypt.hashSync(newGeneratedPassword, 10);

      // Save the updated Driver if the new email is unique
      const updatedDriver = await existingDriver.save();

      // Send an email with the new password
      mailer.send(
          {
              to: ["zbousnina@yahoo.com", updatedDriver.email],
              subject: "Convoyage: Your Account Information has been Updated",
              html: generateEmailTemplateDriver(updatedDriver.name, updatedDriver.email, newGeneratedPassword),
          },
          (err) => {
              if (err) {
                  console.error("Error sending email:", err);
              }
          }
      );

      await logActivity("Driver Updated Successfully", req.user.id, {
          driverId,
          email: updatedDriver.email,
          name: updatedDriver.name
      });

      res.status(200).json({
          success: true,
          Driver: updatedDriver,
          msg: "Driver updated successfully. A new email has been sent with your updated account information.",
      });
  } catch (error) {
      console.error(error);
      await logActivity("Error in updateDriver", req.user.id, { error: error.message });

      res.status(500).json({ message: error.message });
  }
});

const findMissionsByUser = async (req, res) => {
  const { id } = req.user;
  const { limit = 10, skip = 0 } = req.query;

  try {
    // Count the number of missions that match the criteria
    const missionCount = await devisModel.countDocuments({
      $or: [
        { 'mission.driver': null },
        { 'mission.driver': id },
      ],
      $or: [
        { status: 'Confirmée' },
        { status: 'En retard' },
        // { status: 'Démarrée' },
        // { status: 'Confirmée driver' },
      ],
    });

    // Find demands without a driver, with the current driver's id, and in progress
    const missions = await devisModel
      .find({
        $or: [
          { 'mission.driver': null },
          { 'mission.driver': id },
        ],
        $or: [
          { status: 'Confirmée' },
          { status: 'En retard' },
          // { status: 'Démarrée' },
          // { status: 'Confirmée driver' },
        ],
      })
      .populate('mission')
      .populate('partner')
      .sort({ 'mission.dateDepart': -1 }) // Sort by the datedepart property in descending order
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Fetch profiles for partners and create a modified response
    const missionsWithProfiles = await Promise.all(missions.map(async (mission) => {
      let missionWithProfile = { ...mission.toObject() }; // Create a shallow copy of the mission object

      if (mission.partner) {
        const partnerProfile = await profileModels.findOne({ user: mission.partner._id });

        // Check if partnerProfile exists before accessing its properties
        if (partnerProfile) {
          const plainProfile = partnerProfile.toObject();
          // Add the profile attribute to the partner object
          missionWithProfile.partner.profile = plainProfile;
        }
      } else if (mission.mission && mission.mission.user) {
        const partnerProfile = await profileModels.findOne({ user: mission.mission.user._id });

        // Check if partnerProfile exists before accessing its properties
        if (partnerProfile) {
          const plainProfile = partnerProfile.toObject();
          missionWithProfile.profile = plainProfile;
        }
      }

      return missionWithProfile;
    }));

    res.status(200).json({ missions: missionsWithProfiles, count: missionCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const findMissionsConfirmeByUser = async (req, res) => {
  const { id } = req.user;
  const { limit = 10, skip = 0 } = req.query;

  try {
    // Count the number of missions that match the criteria
    const missionCount = await devisModel.countDocuments({

      $or: [
        // { status: 'Confirmée' },
        // { status: 'En retard' },
        { status: 'Démarrée' },
        { status: 'Confirmée driver' },
      ],
    });



    // Find demands without a driver, with the current driver's id, and in progress
    const missionss = await devisModel
      .find({

        $or: [
          // { status: 'Confirmée' },
          // { status: 'En retard' },
          { status: 'Démarrée' },
          { status: 'Confirmée driver' },
        ],
      })
      .populate('mission')
      .populate('partner')
      .sort({ 'mission.dateDepart': -1, 'status': -1 })// Sort by the datedepart property in descending order

      const missions = missionss.filter(item => item.mission.driver == id);

    // Fetch profiles for partners and create a modified response
    const missionsWithProfiles = await Promise.all(missions.map(async (mission) => {
      let missionWithProfile = { ...mission.toObject() }; // Create a shallow copy of the mission object

      if (mission.partner) {
        const partnerProfile = await profileModels.findOne({ user: mission.partner._id });

        // Convert Mongoose document to a plain JavaScript object
        const plainProfile = partnerProfile.toObject();

        // Add the profile attribute to the partner object
        missionWithProfile.partner.profile = plainProfile;
      }else if(mission.mission.user) {
        const partnerProfile = await profileModels.findOne({ user: mission.mission.user._id });

        // Check if partnerProfile exists before accessing its properties
        if (partnerProfile) {
          const plainProfile = partnerProfile.toObject();
          missionWithProfile.profile = plainProfile;
        }
      }

      return missionWithProfile;
    }));

    res.status(200).json({ missions: missionsWithProfiles, count: missionCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ValiderDriverAccount = async (req, res) => {
  const { id } = req.params;

  try {
      // Find the user by ID
      const user = await userModel.findById(id);

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Set driverIsVerified to true in the User model
      user.driverIsVerified = true;
      user.verified = true;

      // Save the changes to the User model
      await user.save();

      // Find the corresponding driver document
      const driverDocument = await driverDocumentsModel.findOne({ user: id });

      if (!driverDocument) {
          return res.status(404).json({ message: 'Driver document not found' });
      }

      // Update driver document details
      driverDocument.verified = true;
      driverDocument.refus = false;
      driverDocument.raisonRefus = '';

      // Save the changes to the DriverDocument model
      await driverDocument.save();
      mailer.send({
        to: ["zbousnina@yahoo.com", user.email],
        subject: "Félicitations ! Votre compte de conducteur a été vérifié par l'administrateur - Bienvenue chez CarVoy !",
        html: generateEmailTemplateValidationAccountByAdmin(user.name),
      }, (err) => {});

      // Return a success response
      return res.status(200).json({ message: 'Driver account successfully verified' });

  } catch (error) {
      // Handle any errors that occurred during the process
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
  }
};
const refusDriverAccount = async (req, res) => {
  const { id } = req.params;
  const { raisonRefus } = req.body;

  try {
      // Find the user by ID
      const user = await userModel.findById(id);

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Set driverIsVerified to true in the User model
      user.driverIsVerified = false;

      // Save the changes to the User model
      await user.save();

      // Find the corresponding driver document
      const driverDocument = await driverDocumentsModel.findOne({ user: id });

      if (!driverDocument) {
          return res.status(404).json({ message: 'Driver document not found' });
      }

      // Update driver document details
      driverDocument.verified = false;
      driverDocument.refus = true;
      driverDocument.raisonRefus = raisonRefus;

      // Save the changes to the DriverDocument model
      await driverDocument.save();
      mailer.send({
        to: ["zbousnina@yahoo.com", user.email],
        subject: "Refus de validation de votre compte CarVoy!",
        html: generateEmailTemplateRefusAccountByAdmin(user.name, raisonRefus),
      }, (err) => {});
      // Return a success response
      return res.status(200).json({ message: 'Driver account successfully refused' });

  } catch (error) {
      // Handle any errors that occurred during the process
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const findLastMissionByUser = async (req, res) => {
  const { id } = req.user;

  try {
    // Find the last mission without a driver, with the current driver's id, and in progress
    const lastMission = await devisModel
      .findOne({
        $or: [
          { 'mission.driver': null },
          { 'mission.driver': id },
        ],
        $or: [
          { status: 'Confirmée' },
          { status: 'En retard' },
          { status: 'Démarrée' },
          { status: 'Confirmée driver' },
        ],
      })
      .populate({
        path: 'mission',
        populate: {
          path: 'driver',
          model: 'User',
        },
      })
      .populate('partner')
      .sort({ createdAt: -1 }) // Sort by the createdAt property in descending order
      .limit(1);

    if (lastMission) { // Ensure that lastMission exists
      let responseMission = { mission: lastMission.toObject() }; // Create a new object for the response

      if (lastMission.partner) {
        const partnerProfile = await profileModels.findOne({ user: lastMission.partner._id });
        if (partnerProfile) {
          const plainProfile = partnerProfile.toObject();
          responseMission.profile = plainProfile;

        }
      } else if (lastMission.mission && lastMission.mission.user) {
        const partnerProfile = await profileModels.findOne({ user: lastMission.mission.user });
        if (partnerProfile) {
          const plainProfile = partnerProfile.toObject();
          responseMission.profile = plainProfile;

        }
      }

      // Send the response with the profile information

      res.status(200).json(responseMission);
    } else {
      // Handle the case where no lastMission is found
      res.status(404).json({ error: "No last mission found for the user." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



const findMissionsTermineeByUser = async (req, res) => {
  const { id } = req.user;
  const { limit = 10, skip = 0 } = req.query;

  try {
    const missionCount = await devisModel.countDocuments({
      $or: [
        { 'mission.driver': null },
        { 'mission.driver': id },
      ],
      $or: [
        { status: 'Terminée' },
      ],
    });

    const missions = await devisModel
      .find({
        $or: [
          { 'mission.driver': null },
          { 'mission.driver': id },
        ],
        $or: [
          { status: 'Terminée' },
        ],
      })
      .populate('mission')
      .populate('partner')
      .sort({ 'mission.dateDepart': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const missionsWithProfiles = await Promise.all(missions.map(async (mission) => {
      let missionWithProfile = { ...mission.toObject() };

      if (mission.partner) {
        const partnerProfile = await profileModels.findOne({ user: mission.partner._id });

        // Check if partnerProfile exists before accessing its properties
        if (partnerProfile) {
          const plainProfile = partnerProfile.toObject();
          missionWithProfile.partner.profile = plainProfile;
        }
      }else if(mission.mission.user) {
        const partnerProfile = await profileModels.findOne({ user: mission.mission.user._id });

        // Check if partnerProfile exists before accessing its properties
        if (partnerProfile) {
          const plainProfile = partnerProfile.toObject();
          missionWithProfile.profile = plainProfile;
        }
      }

      return missionWithProfile;
    }));

    res.status(200).json({ missions: missionsWithProfiles, count: missionCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const findMissionsAcceptedByUser = async (req, res) => {
  const { id } = req.user;
  // const { limit = 10, skip = 0 } = req.query;

  try {
    // Count the number of missions that match the criteria
    const missionCount = await DemandeModel.countDocuments({

      status: 'Accepted',
      driver: id
    });

    // Find demands without a driver, with the current driver's id, and in progress
    const missions = await DemandeModel.find({

      status: 'Accepted',
      driver: id
    })
    .sort({ createdAt: -1 })
    // .limit(parseInt(limit))
    // .skip(parseInt(skip));

    res.status(200).json({ missions, count: missionCount });
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

const findUserActivity = async (req, res) => {
  try {
      const userId = req.user.id; // Get the logged-in user ID

      // Fetch all activity logs for the user
      const activities = await ActivityLog.find({ user: userId }).sort({ createdAt: -1 });

      if (!activities.length) {
          return res.status(404).json({ success: false, message: "No activity found for this user." });
      }

      res.status(200).json({ success: true, activities });
  } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ success: false, message: "Error fetching user activity." });
  }
};




module.exports = {
  findUserActivity,
  updateTrancheConfiguration,
  authUser,
  refreshAuthToken,
  registerUser,
  CompletePartnerProfile,
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
  createDemandeNewVersion,
  findDemandsByUserId,
  incrementOffer,
  decreaseOffer,
  deleteDemande,
  deleteSocket,
  getUsersCount,
  getTotalDemandesCount,
  addAddress,
  findDemandById,
  SetUserStatus,
  AddPartner,
  Register,
  getAllPartner,
  getPartnerById,
  updatePartner,
  updateMission,
  DeleteAccountByAdmin,
  AddDriver,
  AddDriverDoc_DriverLicence,
  finDocByDriver,
  updateDriver,
  getPartnerCount,
  updatePassword,
  getUsersById,
  findMissionsByUser,
  findMissionsConfirmeByUser,
  findLastMissionByUser,
  ValiderDriverAccount,
  refusDriverAccount,
  findMissionsTermineeByUser,
  findDemandsCreatedByPartner,
  findDemandsstatisticsByPartner,
  findDemandsstatisticsAdmin,
  getMissionsCountByUser,
  findAllPartnersAndTheirDemands,
  findAllPartnersAndTheirFactures,
  findAllDriversAndTheirFactures,
  findDriveFactureById,
  GetFactureById,
  findMissionsAcceptedByUser,
  AccepteMission,
  getMissionById,
  updateFieldsForDevis,
  TermineeMission,
  ConfirmeMissionByDriver,
  RefuseMission,
  CompleteMission,
  fetchCurrentUser,
  EmptySocket,
  RemoveSocketById,
  findDevisByPartner,
  findDevisByPartnerId,
  findDevisById,
  RejeteDevis,
  AccepteDevis,
  checkDriverDocumentIsCompleted,
  deleteAllSocketByUser,


}