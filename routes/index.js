var express = require('express');
const {  registerUser } = require('../controllers/users.controller');
var router = express.Router();

/* GET home page. */
router.post('/register',registerUser );

module.exports = router;
