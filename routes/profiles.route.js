const express = require('express');
const passport = require('passport');
const { AddProfile, FindAllProfile, findSingleProfile, DeleteProfile, EditProfile, EditProfileV_WEB } = require('../controllers/profiles.controllers');
const { ROLES, isRole } = require('../security/Rolemiddleware');
const router = express.Router()
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

  // Profiles admin
  // addProfile

//   router.route('/').post(passport.authenticate('jwt', {session: false}),uploads.single('profile'), AddProfile);
// Profiles admin
// addProfile
router.route('/upload-profile',uploads.single('avatar')).post(passport.authenticate('jwt', {session: false}), AddProfile)
router.route('/Edit_profile_web',uploads.single('avatar')).post(passport.authenticate('jwt', {session: false}), EditProfileV_WEB)

router.route('/',uploads.single('avatar')).post(passport.authenticate('jwt', {session: false}), AddProfile)

//find All profile
router.route('/profiles').get( passport.authenticate('jwt', {session: false}),isRole(ROLES.ADMIN), FindAllProfile )
router.route('/EditProfile',uploads.single('avatar')).put( passport.authenticate('jwt', {session: false}), EditProfile )


// get single Profile
router.route('/').get( passport.authenticate('jwt', {session: false}), findSingleProfile )

//delete profile
router.route('/:id').delete( passport.authenticate('jwt', {session: false}),isRole(ROLES.USER, ROLES.ADMIN), DeleteProfile )













module.exports = router