const mongoose = require('mongoose')
const { Schema } = mongoose

const DeamndeSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true

    },

    address:
        {
            latitude: String,
            longitude: String,
            display_name:String
        },

    destination: {
        latitude: String,
        longitude: String,
        display_name:String

        },
        offer:{
            type:String,


        },
    comment:{
        type:String,


    },
    postalAddress:{
        type:String,


    },
    postalDestination:{
        type:String,



    },
    distance:
        {
            type:String,

        },

}, {timestamps:true})

module.exports = mongoose.model('Deamnde', DeamndeSchema)
