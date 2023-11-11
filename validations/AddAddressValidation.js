const isEmpty = require("./isEmpty")

const validator = require('validator')

module.exports = function AddAddressValidation(data) {
    let errors = {}
    data.address = !isEmpty(data.address)? data.address : ""


    // data.bio = !isEmpty(data.bio)? data.bio : ""

    if (validator.isEmpty(data.address)) {
        errors.address = "address field is required"
    }


    // if (validator.isEmpty(data.bio)) {
    //     errors.bio = "Bio field is required"
    // }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}


