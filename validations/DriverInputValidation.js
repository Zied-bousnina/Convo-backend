const isEmpty = require("./isEmpty")

const validator = require('validator')




module.exports = function DriverValidationInput(data) {
    let errors = {}

    data.email = !isEmpty(data.email) ? data.email : ""
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

