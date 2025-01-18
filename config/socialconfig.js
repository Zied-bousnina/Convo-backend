const SocialLoginConfigModel = require("../models/SocialLoginConfig.model");


const getSocialConfig = async (platform) => {
    try {
        const config = await SocialLoginConfigModel.findOne();
        if (!config || !config[platform]) {
            return {
                clientID: process.env[`${platform.toUpperCase()}_CLIENT_ID`],
                clientSecret: process.env[`${platform.toUpperCase()}_CLIENT_SECRET`],
                callbackURL: process.env[`${platform.toUpperCase()}_CALLBACK_URL`],
            };
        }
        return {
            clientID: config[platform].clientId,
            clientSecret: config[platform].clientSecret,
            callbackURL: config[platform].callbackURL,
        };
    } catch (error) {
        console.error(`Error fetching ${platform} config:`, error);
        throw error;
    }
};

module.exports = {
    getSocialConfig,
};
