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
    googleMaps: {
      apiKey:{
        type: String,

      }, // Add Google Maps API Key field
    },
    immatApi: {
      apiKey: {
        type: String,
      }, // Vehicle Registration API Key
      provider: {
        type: String,
        enum: ["apiplaqueimmatriculation", "someOtherProvider"], // Specify provider name(s)
        default: "apiplaqueimmatriculation",
      },
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

module.exports = mongoose.model('SocialLoginConfig', SocialLoginConfigSchema);
