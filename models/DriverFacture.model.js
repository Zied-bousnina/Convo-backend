const mongoose = require('mongoose')
const { Schema } = mongoose

const FactureDriverSchema = new Schema({
    driver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        // required: true
    },


        factures:[
            {
                type: Schema.Types.ObjectId,
                ref: 'Facture',
                // required: true
            }
        ],
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
FactureDriverSchema.pre('save', async function (next) {
    try {
        // Check if numFacture is not already set
        if (!this.numFacture) {
            // Generate a unique incrementing value (you can customize this as per your requirements)
            const count = await mongoose.model('FactureDriver').countDocuments();
            this.numFacture = `FD${count + 1}`;
        }
        next();
    } catch (error) {
        next(error);
    }
});


module.exports = mongoose.model('FactureDriver', FactureDriverSchema)
