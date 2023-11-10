const isEmpty = require("./isEmpty")

const validator = require('validator')

module.exports = function validateBasicInfoInput(data) {
    let errors = {}
    data.firstName = !isEmpty(data.firstName)? data.firstName : ""
    data.lastName = !isEmpty(data.lastName)? data.lastName : ""
    data.dateNais = !isEmpty(data.dateNais)? data.dateNais : ""
    data.email = !isEmpty(data.email)? data.email : ""

    // data.bio = !isEmpty(data.bio)? data.bio : ""

    if (validator.isEmpty(data.firstName)) {
        errors.firstName = "firstName field is required"
    }
    if (validator.isEmpty(data.lastName)) {
        errors.lastName = "lastName field is required"
    }
    if (validator.isEmpty(data.dateNais)) {
        errors.dateNais = "dateNais field is required"
    }
    if (validator.isEmpty(data.email)) {
        errors.email = "email field is required"
    }

    // if (validator.isEmpty(data.bio)) {
    //     errors.bio = "Bio field is required"
    // }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}


