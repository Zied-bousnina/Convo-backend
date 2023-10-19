const isEmpty = require("./isEmpty")
const validator = require('validator')

module.exports = function validateSupportInput(data) {
  let errors = {}
  // data.repporteur = !isEmpty(data.repporteur) ? data.repporteur : ""
  data.supportOn = !isEmpty(data.supportOn) ? data.supportOn : ""
  data.description = !isEmpty(data.description) ? data.description : ""

  // if (validator.isEmpty(data.repporteur)) {
  //   errors.repporteur = "Reporting user field is required"
  // }
  if (validator.isEmpty(data.supportOn)) {
    errors.supportOn = "Support On field is required"
  }
  if (validator.isEmpty(data.description)) {
    errors.description = "Description field is required"
  } else if (!validator.isLength(data.description, { min: 1, max: 1000 })) {
    errors.description = "Description must be between 1 and 1000 characters"
  }

  return {
    errors,
    isValid: isEmpty(errors)
  }
}
