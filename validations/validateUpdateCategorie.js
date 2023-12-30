const isEmpty = require("./isEmpty");
const validator = require('validator');

module.exports = function validateUpdateCategorie(data) {
  let errors = {};



  return {
    errors,
    isValid: isEmpty(errors)
  };
};
