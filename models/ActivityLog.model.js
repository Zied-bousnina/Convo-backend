const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  action: String, // e.g., "Added Partner"
  user: String, // The user who performed the action

  details: Object, // Store additional details (like partner data)
},{timestamps:true});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

module.exports = ActivityLog;
