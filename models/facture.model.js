const mongoose = require('mongoose')
const { Schema } = mongoose

const CategorieSchema = new Schema({

        partner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        from: {
            type: String,
            required: true
        },
        to: {
            type: String,
            required: true
        },
        totalAmmount: {
            type: Number,
            required: true

        }
        }
        }


}, {timestamps:true})

module.exports = mongoose.model('Categorie', CategorieSchema)
