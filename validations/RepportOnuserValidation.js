const isEmpty = require("./isEmpty")
const validator = require('validator')

module.exports = function validateReportUserInput(data) {
  let errors = {}
  // data.repporteur = !isEmpty(data.repporteur) ? data.repporteur : ""
  data.thePersonWhosBeenReported = !isEmpty(data.thePersonWhosBeenReported) ? data.thePersonWhosBeenReported : ""
  data.description = !isEmpty(data.description) ? data.description : ""

  // if (validator.isEmpty(data.repporteur)) {
  //   errors.repporteur = "Reporting user field is required"
  // }
  if (validator.isEmpty(data.thePersonWhosBeenReported)) {
    errors.thePersonWhosBeenReported = "Reported user field is required"
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
