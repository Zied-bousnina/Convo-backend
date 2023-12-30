const express = require('express');
const { ROLES, isRole, isResetTokenValid } = require('../security/Rolemiddleware');
const router = express.Router()
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
  CompleteMission
} = require('../controllers/users.controller');
const passport = require('passport');
const protect = require('../middleware/authMiddleware.js');
const { CreateReportOnuser, CreateSupport } = require('../controllers/Report.controller');

router.route('/').post(registerUser)
router.route('/login').post(authUser)
router.route('/createReport').post(passport.authenticate('jwt', {session: false}),CreateReportOnuser)
router.route('/createSupport').post(passport.authenticate('jwt', {session: false}),CreateSupport)
router.route('/createFeedback').post(passport.authenticate('jwt', {session: false}),CreateFeedback)
router.route('/createDemande').post(passport.authenticate('jwt', {session: false}),createDemande)
router.route('/findDemandsByUserId').get(passport.authenticate('jwt', {session: false}),findDemandsByUserId)
router.route('/incrementOffer/:demandId').post(passport.authenticate('jwt', {session: false}),incrementOffer)
router.route('/AccepteMission/:demandId').post(passport.authenticate('jwt', {session: false}),AccepteMission)
router.route('/RefuseMission/:demandId').post(passport.authenticate('jwt', {session: false}),RefuseMission)
router.route('/CompleteMission/:demandId').post(passport.authenticate('jwt', {session: false}),CompleteMission)
router.route('/decreaseOffer/:demandId').post(passport.authenticate('jwt', {session: false}),decreaseOffer)
router.route('/findDemandById/:demandId').get(passport.authenticate('jwt', {session: false}),findDemandById)
router.route('/findDemandsCreatedByPartner').get(findDemandsCreatedByPartner)
router.route('/findAllPartnersAndTheirDemands').get(findAllPartnersAndTheirDemands )
router.route('/mission/deleteMission/:demandId').delete(passport.authenticate('jwt', {session: false}),deleteDemande)
router.route('/SetUserStatus').post(passport.authenticate('jwt', {session: false}),SetUserStatus)
router.route('/updatePassword').post(passport.authenticate('jwt', {session: false}),updatePassword)
router.route("/getUserCounts").get(getUsersCount)
router.route("/getPartnerCounts").get(getPartnerCount)
router.route("/getDemandeCounts").get(getTotalDemandesCount)
router.route('/AddAddress').post(passport.authenticate('jwt', {session: false}),addAddress)
router.route('/AddPartner').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),AddPartner)
router.route('/driver/AddDriver').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),AddDriver)
router.route('/driver/updateDriver/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),updateDriver)
router.route('/UpdatePartner/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),updatePartner)
router.route('/mission/updateMission/:id').post(passport.authenticate('jwt', {session: false}),updateMission)
router.route('/deleteAccountByAdmin/:id').delete(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),DeleteAccountByAdmin)
router.route('/partnerShip/fetchAll').get(passport.authenticate('jwt', {session: false}),getAllPartner)
router.route('/getMissionsCountByUser').get(passport.authenticate('jwt', {session: false}),getMissionsCountByUser)
router.route('/driver/fetchAll').get(passport.authenticate('jwt', {session: false}),getAllDriver)
router.route('/getUsersById').get(passport.authenticate('jwt', {session: false}),getUsersById)
router.route('/findMissionsByUser').get(passport.authenticate('jwt', {session: false}),findMissionsByUser)
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
router.route('/deleteaccount').post(DeleteAccount)
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
  const { createCategorie, getAllCategorie } = require('../controllers/Categorie.controller')
  router.route('/categorie/create').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),createCategorie)
  router.route('/categorie/getAllCategorie').get(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),getAllCategorie)

  // Devis
  /* ---------------------------- */
  const { createDevis, UpdateDevis } = require('../controllers/Devis.controller')
  router.route('/devis/create').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),createDevis)
  router.route('/devis/UpdateDevis/:id').post(passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN),UpdateDevis)


module.exports = router