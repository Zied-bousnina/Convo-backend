const mongoose = require('mongoose')
const { Schema } = mongoose

const FactureSchema = new Schema({

        partner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            // required: true
        },
        from: {
            type: String,
            // required: true
        },
        to: {
            type: String,
            // required: true
        },
        referenceNumber: {
            type: String,
            // required: true

        },
        freeComment: {
            type: String,
            // required: true

        },
        totalAmmount: {
            type: String,
            // required: true

        },
        mission:{
            type: Schema.Types.ObjectId,
            ref: 'Deamnde',
            // required: true

        },
        payed: {
            type: Boolean,
            default: false

        },
        paymentMethod:{
            type: String,
            // required: true


        },
        numFacture: {
            type: String,
            // required: true

        },
        missions: [{
            type: Schema.Types.ObjectId,
            ref: 'Devis',
        }],


}, {timestamps:true})


// Pre-save middleware to generate and set numFacture
FactureSchema.pre('save', async function (next) {
    try {
        // Check if numFacture is not already set
        if (!this.numFacture) {
            // Generate a unique incrementing value (you can customize this as per your requirements)
            const count = await mongoose.model('Facture').countDocuments();
            this.numFacture = `FP${count + 1}`;
        }
        next();
    } catch (error) {
        next(error);
    }
});
FactureSchema.methods.markMissionsAsIncluded = async function () {
    try {
        await mongoose.model('Devis').updateMany(
            { _id: { $in: this.missions } },
            { $set: { factureIncluded: true } }
        );
    } catch (error) {
        console.error("Error updating missions:", error);
    }
};

// Middleware to mark missions as factureIncluded after saving a facture
FactureSchema.post('save', async function (doc, next) {
    await doc.markMissionsAsIncluded();
    next();
});


module.exports = mongoose.model('Facture', FactureSchema)
