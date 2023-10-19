const mongoose = require('mongoose')
const { Schema } = mongoose

const ContactUsModel = new Schema({
 name: {
    type:String,
    required:true,
 },
  email: {
    type:String,
    required:true,

  },
  tel: {
    type:String,
    required:true,
    minlength:8,
    maxlength:8
  },
  companyName: {
    type:String,

  },
  companyWebSite: {
    type:String,

  },
  jobTitle: {
    type:String,

  },
  country: {
    type:String,
    required:true,
  },
  city: {
    type:String,
    required:true,
  },
  message : {
    type:String,
    required:true,
  },
  status: {
    type:String,
    default: 'in progress',
  }
},
   {timestamps:true}
    );








module.exports = mongoose.model('ContactUs', ContactUsModel)
