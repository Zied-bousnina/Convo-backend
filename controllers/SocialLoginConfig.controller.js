// const SocialLoginConfigModel = require("../models/SocialLoginConfig.model");

const SocialLoginConfigModel = require("../models/SocialLoginConfig.model");


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
    const { platform, clientId, clientSecret } = req.body;

    if (!platform || !clientId || !clientSecret) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
      // Find the existing configuration
      let config = await SocialLoginConfigModel.findOne();
      if (!config) {
        // If not found, create a new configuration
        config = new SocialLoginConfigModel({
          google: {},
          linkedin: {},
        });
      }

      // Update the respective platform configuration
      if (platform === 'google') {
        config.google.clientId = clientId;
        config.google.clientSecret = clientSecret;
      } else if (platform === 'linkedin') {
        config.linkedin.clientId = clientId;
        config.linkedin.clientSecret = clientSecret;
      }

      // Save the updated configuration
      await config.save();
      res.status(200).json({ message: `${platform} configuration updated successfully.` });
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: 'Error updating configuration.', error: error.message });
    }
  };

  module.exports = {
    getSocialLoginConfig,
    updateSocialLoginConfig
};