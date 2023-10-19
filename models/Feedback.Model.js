const mongoose = require('mongoose')
const { Schema } = mongoose

const UserFeedback = new Schema({
  user:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true

},


  feedback : String,




  },
   {timestamps:true}
    );








module.exports = mongoose.model('UserFeedback', UserFeedback)
