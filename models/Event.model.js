const mongoose = require('mongoose');
const { Schema } = mongoose;

const EventSchema = new Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },

  allDay: { type: Boolean, default: false },
  partner:{
    type:Schema.Types.ObjectId,
    ref:'User',
    // required:true

},
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
