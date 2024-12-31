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
    remunerationAmount:
    {
      type: Number,

    },
    distance:
        {
            type:String,

        },
        time :{
            type:String,

        },

        dateDepart:String,
        driverIsAuto:Boolean,
        driver:{
            type:Schema.Types.ObjectId,
            ref:'User',
            // required:true
        },


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


          },
          demareeMissionImages: [
            {
                type: String,
            }

          ],
          termineemissionImages: [
            {
                type: String,
            }

        ],
        demareeMissionCmnt: {
            type: String,

        },
        termineeMissionCmnt: {
            type: String,

        },
        services: {
            main: {
                type: Boolean,
                default: false
            },
            charge: {
                type: Boolean,
                default: false
            },
            exteriorWash: {
                type: Boolean,
                default: false
            },
            interiorCleaning: {
                type: Boolean,
                default: false
            },
            garagePlate: {
                type: Boolean,
                default: false
            },
            fuel: {
                type: Boolean,
                default: false
            }
        },
        vehicleRegistration : {
            type:String

        },
        identityProof  : {
            type:String

        },
        transport: {
            type:String


        },
        price: {
            type:String
        },
        mail: {
            type:String
        },
        immatriculation        : {
            type:String
        },
        phone: {
            type:String
        },
        vehicleData: {
            type: Object, // This allows you to store any object
            default: {}, // Optional: Default to an empty object if no data is provided
          },






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
