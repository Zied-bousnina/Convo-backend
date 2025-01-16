const EventModel = require("../models/Event.model");
const userModel = require("../models/userModel");

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, start, end, allDay = false, partner = null } = req.body;
    console.log(req.body);

    // Validate required fields
    if (!title || !start || !end) {
      return res.status(400).json({ error: "Title, start, and end are required." });
    }

    // Check if the partner exists (if provided)
    if (partner) {
       // Import the User model
      const existingPartner = await userModel.findById(partner);
      if (!existingPartner) {
        return res.status(404).json({ error: "Partner not found." });
      }
    }

    // Create and save the event
    const event = new EventModel({ title, start, end, allDay, partner });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await EventModel.find().populate("partner", "name email"); // Populate partner details
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    // Check if the partner exists (if provided in updates)
    if (updates.partner) {
       // Import the User model
      const existingPartner = await userModel.findById(updates.partner);
      if (!existingPartner) {
        return res.status(404).json({ error: "Partner not found." });
      }
    }

    // Update the event by ID
    const updatedEvent = await EventModel.findByIdAndUpdate(eventId, updates, { new: true }).populate("partner", "name email");
    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.json(updatedEvent);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Delete the event by ID
    const deletedEvent = await EventModel.findByIdAndDelete(eventId);
    if (!deletedEvent) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
