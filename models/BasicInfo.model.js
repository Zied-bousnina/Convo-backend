const mongoose = require('mongoose')
const { Schema } = mongoose

const BasicInfoSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true

    },
    firstName:{
        type:String,


    },
    lastName: {
        type:String
    },

    email:{
        type:String,

    },
    dateNais: {
        type:String

    },
    avatar: String,

}, {timestamps:true})

module.exports = mongoose.model('BasicInfo', BasicInfoSchema)
