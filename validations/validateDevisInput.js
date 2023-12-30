const isEmpty = require("./isEmpty");
const validator = require('validator');

module.exports = function validateDevisInput(data) {
  let errors = {};

  // Assuming categorie is a required field
  data.categorie = !isEmpty(data.categorie) ? data.categorie : "";
  // Assuming mission is a required field
  data.mission = !isEmpty(data.mission) ? data.mission : "";
  data.distance = !isEmpty(data.distance) ? data.distance : "";
  // Assuming montant is a required numeric field
  data.montant = !isEmpty(data.montant) ? data.montant : "";



  if (validator.isEmpty(data.categorie)) {
    errors.categorie = "Categorie field is required";
  }

  if (validator.isEmpty(data.mission)) {
    errors.mission = "Mission field is required";
  }
  if (validator.isEmpty(data.distance)) {
    errors.distance = "distance field is required";
  }
  if (validator.isEmpty(data.montant)) {
    errors.montant = "Montant field is required";
  } else if (!validator.isNumeric(data.montant)) {
    errors.montant = "Montant must be a numeric value";
  } else if (parseFloat(data.montant) <= 0) {
    errors.montant = "Montant must be greater than 0";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
