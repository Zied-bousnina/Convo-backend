const { createFacture, fetchFactureByPartner, fetchFactureById, fetchFacturesByDriver, fetchFactureByDriver, fetchAllFacturesByDriver, PayeeFacture, PayeeFactureDriver, PayeFactureByPartnerHorLigne, PayeeEnligne, PayerEnligneDriver, PayeeEnlignePartner, fetchFacturePartnerById, getTotalAmountByPartner, fetchFactureByMissionId, fetchStatistiquesByPartner } = require('../controllers/facture.controller.js');
const express = require('express');
const { ROLES, isRole, isResetTokenValid } = require('../security/Rolemiddleware');
const router = express.Router()
const jwt = require('jsonwebtoken');

const {
  authUser,
  registerUser,

  getUsers,
  deleteUser,
  getUserById,
  updateUser,

  resetPassword,

  verifyEmail,
  forgotPassword,
  resendOTP,
  getUserByEmail,

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
  DeleteAccountByAdmin,
  getAllDriver,
  AddDriver,
  updateDriver,
  getPartnerCount,
  updatePassword,
  getUsersById,
  findMissionsByUser,
  updateMission,
  findDemandsCreatedByPartner,
  getMissionsCountByUser,
  findAllPartnersAndTheirDemands,
  AccepteMission,
  RefuseMission,
  CompleteMission,
  fetchCurrentUser,
  EmptySocket,
  RemoveSocketById,
  findDevisByPartner,
  findDevisById,
  RejeteDevis,
  findMissionsAcceptedByUser,
  deleteSocket,
  findDevisByPartnerId,
  TermineeMission,
  findMissionsTermineeByUser,
  findLastMissionByUser,
  AddDriverDoc_DriverLicence,
  finDocByDriver,
  findAllPartnersAndTheirFactures,
  GetFactureById,
  findAllDriversAndTheirFactures,
  findDriveFactureById,
  ConfirmeMissionByDriver,
  checkDriverDocumentIsCompleted,
  deleteAllSocketByUser,
  findMissionsConfirmeByUser,
  ValiderDriverAccount,
  refusDriverAccount,
  createDemandeNewVersion,
  getMissionById,
  updateFieldsForDevis,
  findDemandsstatisticsByPartner,
  findDemandsstatisticsAdmin,
  Register,
  CompletePartnerProfile,
  refreshAuthToken
} = require('../controllers/users.controller');
const passport = require('passport');
const protect = require('../middleware/authMiddleware.js');
const { CreateReportOnuser, CreateSupport } = require('../controllers/Report.controller');
const multer = require('multer');


// const multer = require('multer');

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb('invalid image file!', false);
  }
};
const uploads = multer({ storage, fileFilter });
router.route('/').post(registerUser)
// Google Login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {

    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role,
        firstLoginByThirdParty:req.user.firstLoginByThirdParty,


       },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.redirect(`${process.env.NEXT_APP_API_URL}?token=${token}`);
  }
);

// LinkedIn Login
router.get("/linkedin", passport.authenticate("linkedin"));

router.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role,
        firstLoginByThirdParty:req.user.firstLoginByThirdParty,


       },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.redirect(`${process.env.NEXT_APP_API_URL}?token=${token}`);
  }
);

router.route('/login').post(authUser)
router.route('/Register').post(Register)
router.route('/refreshAuthToken').get(passport.authenticate('jwt', {session: false}),refreshAuthToken)
router.route('/CompletePartnerProfile').post(passport.authenticate('jwt', {session: false}),CompletePartnerProfile)
router.route('/createReport').post(passport.authenticate('jwt', {session: false}),CreateReportOnuser)
router.route('/createSupport').post(passport.authenticate('jwt', {session: false}),CreateSupport)
router.route('/createFeedback').post(passport.authenticate('jwt', {session: false}),CreateFeedback)
router.route('/createDemande').post(passport.authenticate('jwt', {session: false}),createDemande)
router.route('/createDemandeNewVersion').post(passport.authenticate('jwt', {session: false}),createDemandeNewVersion)
router.route('/findDemandsByUserId').get(passport.authenticate('jwt', {session: false}),findDemandsByUserId)
router.route('/findStatsPartner').get(passport.authenticate('jwt', {session: false}),fetchStatistiquesByPartner)
router.route('/incrementOffer/:demandId').post(passport.authenticate('jwt', {session: false}),incrementOffer)
router.route('/AccepteMission/:demandId').post(passport.authenticate('jwt', {session: false}),AccepteMission)
router.route('/TermineeMission/:demandId').post(passport.authenticate('jwt', {session: false}),TermineeMission)
router.route('/ConfirmeMissionByDriver/:demandId').post(passport.authenticate('jwt', {session: false}),ConfirmeMissionByDriver)
router.route('/RefuseMission/:demandId').post(passport.authenticate('jwt', {session: false}),RefuseMission)
router.route('/CompleteMission/:demandId').post(passport.authenticate('jwt', {session: false}),CompleteMission)
router.route('/decreaseOffer/:demandId').post(passport.authenticate('jwt', {session: false}),decreaseOffer)
router.route('/findDemandById/:demandId').get(passport.authenticate('jwt', {session: false}),findDemandById)
router.route('/findDemandsCreatedByPartner').get(findDemandsCreatedByPartner)
router.route('/findAllPartnersAndTheirDemands').get(findAllPartnersAndTheirDemands )
router.route('/findAllPartnersAndTheirFactures').get(findAllPartnersAndTheirFactures )
router.route('/getMissionById/:id').get(getMissionById )
router.route('/getFactureByMissionId/:id').get(fetchFactureByMissionId )
router.route('/findAllDriversAndTheirFactures').get(findAllDriversAndTheirFactures )
router.route('/mission/deleteMission/:demandId').delete(passport.authenticate('jwt', {session: false}),deleteDemande)
router.route('/factureById/:id').get(passport.authenticate('jwt', {session: false}),GetFactureById)
router.route('/factureDriverById/:id').get(passport.authenticate('jwt', {session: false}),findDriveFactureById)
router.route('/payeeFacture/:id').get(passport.authenticate('jwt', {session: false}),PayeeFacture)
router.route('/payeeFactureDriver/:id').get(passport.authenticate('jwt', {session: false}),PayeeFactureDriver)
router.route('/SetUserStatus').post(passport.authenticate('jwt', {session: false}),SetUserStatus)
router.route('/updatePassword').post(passport.authenticate('jwt', {session: false}),updatePassword)
router.route("/getUserCounts").get(getUsersCount)
router.route("/getPartnerCounts").get(getPartnerCount)
router.route("/getDemandeCounts").get(getTotalDemandesCount)
router.route('/AddAddress').post(passport.authenticate('jwt', {session: false}),addAddress)
router.route('/AddPartner').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),AddPartner)

router.route('/driver/AddDriver').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),AddDriver)
router.route('/driver/UpdateDocDriver').post(passport.authenticate('jwt', {session: false}),AddDriverDoc_DriverLicence)
router.route('/driver/checkDriverDocumentIsCompleted').get(passport.authenticate('jwt', {session: false}),isRole(ROLES.DRIVER),checkDriverDocumentIsCompleted)
router.route('/driver/deleteAllSocketByUser').get(passport.authenticate('jwt', {session: false}),isRole(ROLES.DRIVER),deleteAllSocketByUser)
router.route('/driver/finDocByDriver').get(passport.authenticate('jwt', {session: false}),finDocByDriver)
router.route('/driver/updateDriver/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),updateDriver)
router.route('/updateFieldsForDevis').post(passport.authenticate('jwt', {session: false}),updateFieldsForDevis)
router.route('/UpdatePartner/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),updatePartner)
router.route('/mission/updateMission/:id').post(passport.authenticate('jwt', {session: false}),updateMission)
router.route('/deleteAccountByAdmin/:id').delete(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),DeleteAccountByAdmin)
router.route('/Driver/ValiderDriverAccount/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),ValiderDriverAccount)
router.route('/Driver/refusDriverAccount/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),refusDriverAccount)
router.route('/partnerShip/fetchAll').get(passport.authenticate('jwt', {session: false}),getAllPartner)
router.route('/getMissionsCountByUser').get(passport.authenticate('jwt', {session: false}),getMissionsCountByUser)
router.route('/getTotalAmountByPartner').get(passport.authenticate('jwt', {session: false}),getTotalAmountByPartner)
router.route('/driver/fetchAll').get(passport.authenticate('jwt', {session: false}),getAllDriver)
router.route('/getUsersById').get(passport.authenticate('jwt', {session: false}),getUsersById)
router.route('/findMissionsByUser').get(passport.authenticate('jwt', {session: false}),findMissionsByUser)
router.route('/findMissionsConfirmeByUser').get(passport.authenticate('jwt', {session: false}),findMissionsConfirmeByUser)
router.route('/findLastMissionByUser').get(passport.authenticate('jwt', {session: false}),findLastMissionByUser)
router.route('/findMissionsTermineeByUser').get(passport.authenticate('jwt', {session: false}),findMissionsTermineeByUser)
router.route('/findDemandsstatisticsByPartner').get(passport.authenticate('jwt', {session: false}),findDemandsstatisticsByPartner)
router.route('/findDemandsstatisticsAdmin').get(passport.authenticate('jwt', {session: false}),findDemandsstatisticsAdmin)
router.route('/findMissionsAcceptedByUser').get(passport.authenticate('jwt', {session: false}),findMissionsAcceptedByUser)
router.route('/partnerShip/fetchByID/:id').get(passport.authenticate('jwt', {session: false}),getPartnerById)
router.get('/checkTokenValidity', passport.authenticate('jwt', {session: false}), (req, res) => {
  // If the control reaches here, the token is valid
  res.status(200).json({ message: 'Token is valid' });
});


router.route('/getUsers').get(getUsers)
  router.route('/getUserByEmail/:email').get(getUserByEmail)
  // router.route('/registerGoogleUser').post(registerGoogleUser)
//   .put(protect, updateUser)
router.route('/verifyemail').post(verifyEmail)
router.route('/deleteaccount').post(passport.authenticate('jwt', {session: false}),DeleteAccount)
router.route("/forgot-password").post( forgotPassword )
router.route("/resendotp").post( resendOTP )
router.route("/resendOTPDeleteAccount").post( resendOTPDeleteAccount )
// router.post("/reset-password", resetPassword )
router.post("/reset-password",isResetTokenValid,  resetPassword )
// router.get("/addAccessCode",  addAccessCode )
// router.route("/access/addAccess").put(passport.authenticate('jwt', {session: false}),addAccessCode)
// router.route("/access/getCurrentAccessList").get(passport.authenticate('jwt', {session: false}),getCurrentAccessList)
// router.route("/access/getAllUserWhoHasASameAccessBin").get(passport.authenticate('jwt', {session: false}),getAllUserWhoHasASameAccessBin)
router.get("/verify-token", isResetTokenValid, (req, res)=> {
  res.json({success:true})
})

router.route('/profile/password/reset').post(protect ,resetPassword);
router.route('/block/:id').put(blockUser);
router.route('/deblock/:id').put(deblockUser);

router
  .route('/:id')
//   .delete(protect, deleteUser)
  .get(getAllUserDetailsById)



  // Categorie
  /* ---------------------------- */

  const { createCategorie, getAllCategorie, FindCategorieByid, deleteCategorie, UpdateCategorie } = require('../controllers/Categorie.controller')
  router.route('/categorie/create').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),createCategorie)
  router.route('/deleteSocket/:id').post(deleteSocket)
  router.route('/categorie/getAllCategorie').get(getAllCategorie)
  router.route('/categorie/:id').get(FindCategorieByid)
  router.route('/categorie/deleteCategorie/:id').delete(passport.authenticate('jwt', {session: false}),deleteCategorie)
  router.route('/categorie/updateCategorie/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),UpdateCategorie)
  router.route('/users/currentUser').get(passport.authenticate('jwt', {session: false}),fetchCurrentUser )
  router.route('/users/EmptySocket').post(passport.authenticate('jwt', {session: false}),EmptySocket )
  router.route('/users/RemoveSocketById/:id').post(passport.authenticate('jwt', {session: false}),RemoveSocketById )
  // Devis

  /* ---------------------------- */
  const { createDevis, UpdateDevis, getAllDevisByPartner } = require('../controllers/Devis.controller');
const { saveStripeConfig, getStripeConfig } = require('../controllers/StripeConfig.controller.js');
const { getStripe } = require('../config/stripe.js');
const { getSocialLoginConfig, updateSocialLoginConfig } = require('../controllers/SocialLoginConfig.controller.js');
const { default: axios } = require('axios');
  router.route('/devis/create').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),createDevis)
  router.route('/devis/UpdateDevis/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),UpdateDevis)
  router.route('/devis/getAllDevisByPartner/:id').get(getAllDevisByPartner)
  router.route('/devis/findDevisByPartner').get(passport.authenticate('jwt', {session: false}),findDevisByPartner )
  router.route('/devis/findDevisByPartnerId/:id').post(findDevisByPartnerId )
  router.route('/devis/findDevisById/:id').get(passport.authenticate('jwt', {session: false}),findDevisById )
  router.route('/devis/rejectDevis/:id').post(passport.authenticate('jwt', {session: false}),RejeteDevis )

  //  Facture---------------------
  router.route("/facture/create").post(createFacture)
  router.route('/facture/fetchFactureByPartner').get(passport.authenticate('jwt', {session: false}),fetchFactureByPartner )
  router.route('/facture/findFactureById/:id').get(passport.authenticate('jwt', {session: false}),fetchFactureById )
  router.route('/facture/fetchFacturePartnerById/:id').get(passport.authenticate('jwt', {session: false}),fetchFacturePartnerById )
  router.route('/facture/fetchFactureByDriver').post(passport.authenticate('jwt', {session: false}),fetchFactureByDriver )
  router.route('/facture/findFactureBydriver').get(passport.authenticate('jwt', {session: false}),fetchFacturesByDriver )
  router.route('/facture/fetchAllFacturesByDriver').get(passport.authenticate('jwt', {session: false}),fetchAllFacturesByDriver )
  router.route('/facture/PayeFactureByPartnerHorLigne/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN, ROLES.PARTNER),PayeFactureByPartnerHorLigne )
  router.route('/facture/PayerEnLigne/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN, ROLES.PARTNER),PayeeEnligne )
  router.route('/facture/PayerEnLignePartner').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN, ROLES.PARTNER),PayeeEnlignePartner )
  router.route('/facture/PayerEnligneDriver/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN, ROLES.PARTNER),PayeeFactureDriver )

  // Payment Gateway
  router.route('/payment-gateway').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),saveStripeConfig)
  router.route('/get-payment-gateway').post(passport.authenticate('jwt', {session: false}),getStripeConfig)


  // SocialLoginConfig

  router.route('/getsocial-login-config').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),getSocialLoginConfig)
  router.route('/social-login-config').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),updateSocialLoginConfig)
  router.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url; // LinkedIn image URL
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Error fetching image');
    }
});



module.exports = router