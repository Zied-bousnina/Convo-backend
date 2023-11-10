const isEmpty = require("./isEmpty")
const validator = require('validator')

module.exports = function validateDemandeInput(data) {
  let errors = {}


//   data.address = !isEmpty(data.address) ? data.address : ""
//   data.destination = !isEmpty(data.destination) ? data.destination : ""
  data.offer = !isEmpty(data.offer) ? data.offer : ""
  data.postalAddress = !isEmpty(data.postalAddress) ? data.postalAddress : ""
  data.postalDestination = !isEmpty(data.postalDestination) ? data.postalDestination : ""



  // }
//   if (validator.isEmpty(data.destination)) {
//     errors.destination = "destination On field is required"
//   }
//   if (validator.isEmpty(data.address)) {
//     errors.address = "address On field is required"
//   }
  if (validator.isEmpty(data.offer)) {
    errors.offer = "offer On field is required"
  }
  if (validator.isEmpty(data.postalDestination)) {
    errors.postalDestination = "postalDestination On field is required"
  }
  if (validator.isEmpty(data.postalAddress)) {
    errors.postalAddress = "postalAddress On field is required"
  }


  return {
    errors,
    isValid: isEmpty(errors)
  }
}
