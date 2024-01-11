

const mongoose = require('mongoose')
const { Schema } = mongoose

const DevisSchema = new Schema({
    categorie:{
        type:Schema.Types.ObjectId,
        ref:'Categorie',
        required:true

    },
    mission:{
        type:Schema.Types.ObjectId,
        ref:'Deamnde',
        required:true

    },
    partner:{
        type:Schema.Types.ObjectId,
        ref:'User',
        // required:true

    },
    montant: {
            type: Number, // Assuming unitPrice is a numeric value (number réel)
          },
          rectification: {
            type: Number, // Assuming unitPrice is a numeric value (number réel)
          },

          status: {
            type:String,
            default: 'in progress',
          },
          distance:
        {
            type:String,

        },
        remunerationAmount:
        {
          type: Number,

        },




}, {timestamps:true})

module.exports = mongoose.model('Devis', DevisSchema)
