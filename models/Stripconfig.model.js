const mongoose = require("mongoose");

const StripeConfigSchema = new mongoose.Schema({
  publishableKey: {
    type: String,
    required: true,
    trim: true,
  },
  secretKey: {
    type: String,
    required: true,
    trim: true,
  },
  webhookSecret: {
    type: String,
    trim: true, // Optional field
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a pre-save middleware to update the updatedAt field
StripeConfigSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("StripeConfig", StripeConfigSchema);
