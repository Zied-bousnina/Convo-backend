const isEmpty = require("./isEmpty");
const validator = require('validator');

module.exports = function validateCategorieInput(data) {
  let errors = {};

  // Assuming description is a required field
  data.description = !isEmpty(data.description) ? data.description : "";
  // Assuming unitPrice is a required numeric field
  data.unitPrice = !isEmpty(data.unitPrice) ? data.unitPrice : "";

  if (validator.isEmpty(data.description)) {
    errors.description = "Description field is required";
  }

  // Additional validation for numeric unitPrice
  if (validator.isEmpty(data.unitPrice)) {
    errors.unitPrice = "Unit Price field is required";
  } else if (!validator.isNumeric(data.unitPrice)) {
    errors.unitPrice = "Unit Price must be a numeric value";
  } else if (parseFloat(data.unitPrice) <= 0) {
    errors.unitPrice = "Unit Price must be greater than 0";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
