// const SocialLoginConfigModel = require("../models/SocialLoginConfig.model");

const SocialLoginConfigModel = require("../models/SocialLoginConfig.model");
const logActivity = require("../utils/logger"); // Import logger


const getSocialLoginConfig = async (req, res) => {
    try {
      const config = await SocialLoginConfigModel.findOne();
      if (!config) {
        return res.status(404).json({ message: 'Configuration not found.' });
      }
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching configuration.', error: error.message });
    }
  };

  const updateSocialLoginConfig = async (req, res) => {
    const { platform, clientId, clientSecret, apiKey, provider } = req.body;
    console.log(req.body);

    try {
        let config = await SocialLoginConfigModel.findOne();
        if (!config) {
            config = new SocialLoginConfigModel({
                google: {},
                linkedin: {},
                googleMaps: {},
                immatApi: {},
            });
        }

        console.log(platform === "googleMaps");

        if (platform === "google") {
            console.log(clientId);
            config.google.clientId = clientId;
            config.google.clientSecret = clientSecret;
        } else if (platform === "linkedin") {
            config.linkedin.clientId = clientId;
            config.linkedin.clientSecret = clientSecret;
        } else if (platform === "googleMaps") {
            console.log(apiKey);
            config.googleMaps.apiKey = apiKey;
        } else if (platform === "immatApi") {
            console.log(apiKey);
            config.immatApi.apiKey = apiKey;
            config.immatApi.provider = provider || "apiplaqueimmatriculation";
        }

        await config.save();

        await logActivity("Updated Social Login Configuration", req.user.id, { platform, clientId, clientSecret, apiKey, provider });

        res.status(200).json({ message: `${platform} configuration updated successfully.` });
    } catch (error) {
        await logActivity("Error in updateSocialLoginConfig", req.user.id, { error: error.message });

        res.status(500).json({ message: "Error updating configuration.", error: error.message });
    }
};

  module.exports = {
    getSocialLoginConfig,
    updateSocialLoginConfig,
  };

//   module.exports = {
//     getSocialLoginConfig,
//     updateSocialLoginConfig
// };