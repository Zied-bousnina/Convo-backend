const mongoose = require('mongoose')
const { Schema } = mongoose

const RepportUser = new Schema({
  repporteur:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true

},
thePersonWhosBeenReported:{
  type:Schema.Types.ObjectId,
  ref:'User',
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








module.exports = mongoose.model('RepportUser', RepportUser)
