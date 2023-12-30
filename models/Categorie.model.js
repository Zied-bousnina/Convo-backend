const mongoose = require('mongoose')
const { Schema } = mongoose

const CategorieSchema = new Schema({

        description:{
            type:String,


        },
        unitPrice: {
            type: Number, // Assuming unitPrice is a numeric value (number réel)
          },


}, {timestamps:true})

module.exports = mongoose.model('Categorie', CategorieSchema)
