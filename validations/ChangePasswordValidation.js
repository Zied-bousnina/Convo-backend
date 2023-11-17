const isEmpty = require("./isEmpty")

const validator = require('validator')




module.exports = function changePasswordValidation(data) {
    let errors = {}

    data.confirm = !isEmpty(data.confirm) ? data.confirm : ""
    data.newPassword = !isEmpty(data.newPassword) ? data.newPassword : ""


    // if (!validator.isLength(data.name, { min: 2, max: 30 })) {
    //     errors.name = "Name must be between 2 and 30 characters"
    // }

    if (validator.isEmpty(data.confirm)) {
        errors.confirm = "confirm field is required"
    }

    if (validator.isEmpty(data.newPassword)) {
        errors.newPassword = "newPassword field is required"
    }
    if (!validator.isLength(data.newPassword, { min: 6, max: 30 })) {
        errors.newPassword = "newPassword must be at least 6 characters"
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

