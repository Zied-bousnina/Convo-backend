const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BusinessDetailsSchema = new Schema({
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  siret: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("BusinessDetails", BusinessDetailsSchema);
