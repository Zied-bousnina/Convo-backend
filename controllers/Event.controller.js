// const Event = require("../models/Event");

const EventModel = require("../models/Event.model");

// Create a new event
exports.createEvent = async (req, res) => {
    try {
      const { title, start, end, calendar = "default", allDay = false } = req.body;

      if (!title || !start || !end) {
        return res.status(400).json({ error: "Title, start, and end are required." });
      }

      const event = new EventModel({ title, start, end, calendar, allDay });
      await event.save();
      res.status(201).json(event);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };


// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await EventModel.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
    console.log(req.body)
  try {
    const { eventId } = req.params;
    const updates = req.body;
    const updatedEvent = await EventModel.findByIdAndUpdate(eventId, updates, { new: true });
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    await EventModel.findByIdAndDelete(eventId);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
