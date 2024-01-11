



const mongoose = require('mongoose')
const { Schema } = mongoose

const SocketSchema = new Schema({

    Newsocket:
    {
        type: String,
        // required: true,
    },






}, {timestamps:true})

module.exports = mongoose.model('socket', SocketSchema)
