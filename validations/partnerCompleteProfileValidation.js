const isEmpty = require("./isEmpty")

const validator = require('validator')




module.exports = function partnerCompleteProfileValidation(data) {
    let errors = {}


    data.addressPartner = !isEmpty(data.addressPartner) ? data.addressPartner : ""
    data.contactName = !isEmpty(data.contactName) ? data.contactName : ""
    data.phoneNumber = !isEmpty(data.phoneNumber) ? data.phoneNumber : ""



    // if (!validator.isLength(data.name, { min: 2, max: 30 })) {
    //     errors.name = "Name must be between 2 and 30 characters"
    // }


    if (validator.isEmpty(data.addressPartner)) {
        errors.addressPartner = "addressPartner field is required"
    }
    if (validator.isEmpty(data.contactName)) {
        errors.contactName = "contactName field is required"
    }
    if (validator.isEmpty(data.phoneNumber)) {
        errors.phoneNumber = "phoneNumber field is required"
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

