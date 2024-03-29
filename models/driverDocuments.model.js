const mongoose = require('mongoose')
const { Schema } = mongoose

const DriverDocumentsSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true

    },


    assurance:{
        type:String,

    },
    CinfrontCard: {
        type:String

    },
    CinbackCard: {
        type:String

    },
    permisConduirefrontCard: {
        type:String

    },
    kbis:{
        type:String,
        // required:true

    },
    permisConduirebackCard: {
        type:String

    },
    proofOfAddress: {
        type:String

    },
    avatar: String,
    verified:{
        type:Boolean,
        default:false

    },
    refus: {
        type:Boolean,
        default:false
    },
    raisonRefus : {
        type:String
    }

}, {timestamps:true})

module.exports = mongoose.model('DriverDocuments', DriverDocumentsSchema)
