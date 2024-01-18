const isEmpty = require("./isEmpty")

const validator = require('validator')
module.exports = function demandeMunicipalInputValidator(data) {
    let errors = {}
    data.tel = !isEmpty(data.tel)? data.tel : ""
    data.governorat = !isEmpty(data.governorat)? data.governorat : ""
    data.municipal = !isEmpty(data.municipal)? data.municipal : ""
    data.description = !isEmpty(data.description)? data.description : ""
    data.postalCode = !isEmpty(data.postalCode)? data.postalCode : ""
    // data.bio = !isEmpty(data.bio)? data.bio : ""

    if (validator.isEmpty(data.tel)) {
        errors.tel = "Tel field is required"
    }
    if (validator.isEmpty(data.governorat)) {
        errors.governorat = "governorat field is required"
    }
    if (validator.isEmpty(data.municipal)) {
        errors.municipal = "municipal field is required"
    }
    if (validator.isEmpty(data.description)) {
        errors.description = "description field is required"
    }
    if (validator.isEmpty(data.postalCode)) {
        errors.postalCode = "Postal Code field is required"
    }
    // if (validator.isEmpty(data.bio)) {
    //     errors.bio = "Bio field is required"
    // }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}
module.exports = function validateProfileInput(data) {
    let errors = {}
    data.tel = !isEmpty(data.tel)? data.tel : ""
    data.governorat = !isEmpty(data.governorat)? data.governorat : ""
    data.municipal = !isEmpty(data.municipal)? data.municipal : ""
    data.description = !isEmpty(data.description)? data.description : ""
    data.postalCode = !isEmpty(data.postalCode)? data.postalCode : ""
    // data.bio = !isEmpty(data.bio)? data.bio : ""

    if (validator.isEmpty(data.tel)) {
        errors.tel = "Tel field is required"
    }
    if (validator.isEmpty(data.governorat)) {
        errors.governorat = "governorat field is required"
    }
    if (validator.isEmpty(data.municipal)) {
        errors.municipal = "municipal field is required"
    }
    if (validator.isEmpty(data.description)) {
        errors.description = "description field is required"
    }
    if (validator.isEmpty(data.postalCode)) {
        errors.postalCode = "Postal Code field is required"
    }
    // if (validator.isEmpty(data.bio)) {
    //     errors.bio = "Bio field is required"
    // }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}





