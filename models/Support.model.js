const mongoose = require('mongoose')
const { Schema } = mongoose

const Support = new Schema({
  repporteur:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true

},
supportOn:{
  type : String,
  required:true
},
  description:{
    type:String,
    required:true,
    minlength:1,
    maxlength:1000
},
status:{
  type:String,

  // enum:[ "readed", "unreaded" ],
  default: 'Readed'
},


image: String

  },
   {timestamps:true}
    );








module.exports = mongoose.model('Support', Support)
