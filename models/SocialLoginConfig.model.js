const mongoose = require('mongoose');

const SocialLoginConfigSchema = new mongoose.Schema(
  {
    google: {
      clientId: {
        type: String,

      },
      clientSecret: {
        type: String,

      },
    },
    linkedin: {
      clientId: {
        type: String,

      },
      clientSecret: {
        type: String,

      },
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

module.exports = mongoose.model('SocialLoginConfig', SocialLoginConfigSchema);
