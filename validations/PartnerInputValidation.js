const isEmpty = require("./isEmpty")

const validator = require('validator')




module.exports = function PartnerValidationInput(data) {
    let errors = {}

    data.email = !isEmpty(data.email) ? data.email : ""
    data.addressPartner = !isEmpty(data.addressPartner) ? data.addressPartner : ""
    data.contactName = !isEmpty(data.contactName) ? data.contactName : ""
    data.phoneNumber = !isEmpty(data.phoneNumber) ? data.phoneNumber : ""
    data.name = !isEmpty(data.name) ? data.name : ""


    // if (!validator.isLength(data.name, { min: 2, max: 30 })) {
    //     errors.name = "Name must be between 2 and 30 characters"
    // }

    if (validator.isEmpty(data.email)) {
        errors.email = "Email field is required"
    }
    if (!validator.isEmail(data.email)) {
        errors.email = "Email is invalid"
    }
    if (validator.isEmpty(data.addressPartner)) {
        errors.addressPartner = "addressPartner field is required"
    }
    if (validator.isEmpty(data.contactName)) {
        errors.contactName = "contactName field is required"
    }
    if (validator.isEmpty(data.phoneNumber)) {
        errors.phoneNumber = "phoneNumber field is required"
    }
    if (validator.isEmpty(data.name)) {
        errors.name = "name field is required"
    }


    // if (errors.length > 0) {
    //     return {
    //         errors,
    //         isValid: isEmpty(errors)
    //     }
    // }
    return {
        errors,
        isValid: isEmpty(errors)
        }


}

