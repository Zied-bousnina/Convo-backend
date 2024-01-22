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

        }


}, {timestamps:true})

module.exports = mongoose.model('Facture', FactureSchema)
