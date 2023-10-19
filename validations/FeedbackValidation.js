const isEmpty = require("./isEmpty")
const validator = require('validator')

module.exports = function validateFeedbackInput(data) {
  let errors = {}


  data.feedback = !isEmpty(data.feedback) ? data.feedback : ""


  // }
  if (validator.isEmpty(data.feedback)) {
    errors.feedback = "Feedback On field is required"
  }


  return {
    errors,
    isValid: isEmpty(errors)
  }
}
