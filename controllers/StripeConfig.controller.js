const StripconfigModel = require("../models/Stripconfig.model");


const saveStripeConfig = async (req, res) => {
  try {
    const { publishableKey, secretKey, webhookSecret } = req.body;

    if (!publishableKey || !secretKey) {
      return res.status(400).json({ message: "Publishable Key and Secret Key are required." });
    }

    // Check if a configuration already exists
    let config = await StripconfigModel.findOne();

    if (config) {
      // Update existing configuration
      config.publishableKey = publishableKey;
      config.secretKey = secretKey;
      config.webhookSecret = webhookSecret;
      await config.save();
    } else {
      // Create new configuration
      config = new StripconfigModel({
        publishableKey,
        secretKey,
        webhookSecret,
      });
      await config.save();
    }

    res.status(200).json({
      message: "Stripe configuration saved successfully.",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStripeConfig = async (req, res) => {
    console.log("getStripeConfig");
  try {
    console.log("getStripeConfig");
    const config = await StripconfigModel.findOne();
    console.log("config", config);
    if (!config) {
      return res.status(404).json({ message: "Stripe configuration not found." });
    }
    res.status(200).json({
      message: "Stripe configuration retrieved successfully.",
      data: config,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  saveStripeConfig,
  getStripeConfig,
};
