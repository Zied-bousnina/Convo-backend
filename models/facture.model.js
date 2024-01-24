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
        numFacture: {
            type: String,
            // required: true

        },


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


module.exports = mongoose.model('Facture', FactureSchema)
