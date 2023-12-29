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
        dateDepart:String,
        driverIsAuto:Boolean,
        driver:{
            type:Schema.Types.ObjectId,
            ref:'User',
            // required:true
        },
        // isAccepted:Boolean,
        // isRefused:Boolean,
        // isPending:Boolean,
        // isFinished:Boolean,
        // isCanceled:Boolean,
        // isPaid:Boolean,
        // isRated:Boolean,
        // rating:Number,
        // price:Number,
        // isPaid:Boolean,

        status: {
            type:String,
            default: 'in progress',
          },
          missionType: {
            type:String,
            default: 'normal',
          },
          vehicleType: {
            type:String,
            default: 'normal',


          }



}, {timestamps:true})

module.exports = mongoose.model('Deamnde', DeamndeSchema)
