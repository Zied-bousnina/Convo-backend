const express = require('express');
const passport = require('passport');
const router = express.Router();
const multer = require('multer');
const { AddBasicInfo, findBasicInfoByUserId } = require('../controllers/BasicInfo.controllers');
const { getUsers } = require('../controllers/users.controller');

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb('Invalid image file!', false);
  }
};

const uploads = multer({ storage, fileFilter });

// Apply the multer middleware before the route handler
// router.route('/').post(passport.authenticate('jwt', { session: false }), uploads.single('avatar'), AddBasicInfo);
router.route('/',uploads.single('avatar')).post(passport.authenticate('jwt', {session: false}), AddBasicInfo)
router.route('/findBasicProfileById').get(passport.authenticate('jwt', {session: false}), findBasicInfoByUserId)


module.exports = router;
