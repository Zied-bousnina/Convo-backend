const ActivityLog = require("../models/ActivityLog.model");


// Function to log activities
const logActivity = async (action, user, details = {}) => {
  try {
    const log = new ActivityLog({ action, user, details });
    await log.save();
    console.log("Activity logged:", action);
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

module.exports = logActivity;
