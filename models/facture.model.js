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
// FactureSchema.pre('save', async function (next) {
//     try {
//         // Check if numFacture is not already set
//         if (!this.numFacture) {
//             // Generate a unique incrementing value (you can customize this as per your requirements)
//             const count = await mongoose.model('Facture').countDocuments();
//             this.numFacture = `FP${count + 1}`;
//         }
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

FactureSchema.pre('save', async function (next) {
    try {
        if (!this.numFacture) {
            const user = await mongoose.model('User').findById(this.partner);

            // Check if the user has the role 'driver'
            if (user && user.role === 'driver') {
                // Do not increment numFacture
                this.numFacture = `F0`; // Or any other format you want for driver
            } else {
                // Find the largest existing numFacture and increment it
                const maxFacture = await mongoose.model('Facture')
                    .findOne({}, { numFacture: 1 })
                    .sort({ numFacture: -1 })
                    .limit(1);

                const maxNumFacture = maxFacture ? parseInt(maxFacture.numFacture.slice(1)) : 0;
                this.numFacture = `FP${maxNumFacture + 1}`;
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});


module.exports = mongoose.model('Facture', FactureSchema)
