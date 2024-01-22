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

        }



}, {timestamps:true})

module.exports = mongoose.model('FactureDriver', FactureDriverSchema)
