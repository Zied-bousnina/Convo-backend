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

// Middleware to check and update status after 2 hours
DeamndeSchema.pre('save', function (next) {
    // Only perform this check if the status is 'confirmée'
    if (this.status === 'Confirmée') {
        const twoHoursInMillis = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        const currentTime = new Date();
        const timeDifference = currentTime - this.createdAt;

        // If more than 2 hours have passed, update the status to 'En retard'
        if (timeDifference >= twoHoursInMillis) {
            this.status = 'En retard';
        }
    }

    next();
});

module.exports = mongoose.model('Deamnde', DeamndeSchema)
