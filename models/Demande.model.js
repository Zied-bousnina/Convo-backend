const mongoose = require('mongoose')
const { Schema } = mongoose
const TrancheSchema = new Schema({
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    remuneration: { type: Number, required: true }
});
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
          tranches: [TrancheSchema], // Store dynamic pricing tranches
    factureIncluded: { type: Boolean, default: false }, // Whether to include in invoice






}, {timestamps:true})

// Middleware to check and update status after 2 hours
DeamndeSchema.methods.calculateRemuneration = function () {
    if (!this.distance || isNaN(this.distance)) return;

    const distance = Number(this.distance);

    if (this.tranches.length > 0) {
        // Find the matching tranche
        const tranche = this.tranches.find(t => distance >= t.min && distance <= t.max);
        this.remunerationAmount = tranche ? tranche.remuneration : this.price; // Default to price if no match
    } else {
        this.remunerationAmount = this.price; // If no tranches, use fixed price
    }
};

/**
 * Static function to update pricing dynamically
 */
DeamndeSchema.statics.updatePricing = async function (id, price, tranches, factureIncluded) {
    const demande = await this.findById(id);
    if (!demande) throw new Error("Mission request not found");

    // Update price, tranches, and invoice inclusion
    demande.price = price;
    demande.factureIncluded = factureIncluded;

    if (tranches && Array.isArray(tranches)) {
        demande.tranches = tranches;
    }

    // Recalculate remuneration
    demande.calculateRemuneration();
    return demande.save();
};

// Middleware to update remuneration before saving
DeamndeSchema.pre('save', function (next) {
    this.calculateRemuneration();
    next();
});

module.exports = mongoose.model('Deamnde', DeamndeSchema)
