const mongoose = require('mongoose');
const { Schema } = mongoose;

const EventSchema = new Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  calendar: { type: String, required: true }, // e.g., 'business', 'personal'
  allDay: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
