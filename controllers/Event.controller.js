const EventModel = require("../models/Event.model");
const userModel = require("../models/userModel");

const logActivity = require("../utils/logger"); // Import logger
exports.createEvent = async (req, res) => {
    try {
        const { title, start, end, allDay = false, partner = null } = req.body;

        // Validate required fields
        if (!title || !start || !end) {
            await logActivity("Failed to Create Event", req.user.id, { reason: "Missing required fields", title, start, end });
            return res.status(400).json({ error: "Title, start, and end are required." });
        }

        // Check if the partner exists (if provided)
        if (partner) {
            const existingPartner = await userModel.findById(partner);
            if (!existingPartner) {
                await logActivity("Failed to Create Event", req.user.id, { reason: "Partner not found", partner });
                return res.status(404).json({ error: "Partner not found." });
            }
        }

        // Create and save the event
        const event = new EventModel({ title, start, end, allDay, partner });
        await event.save();

        await logActivity("Created Event", req.user.id, { title, start, end, allDay, partner });

        res.status(201).json(event);
    } catch (err) {
        await logActivity("Error in createEvent", req.user.id, { error: err.message });
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
            const existingPartner = await userModel.findById(updates.partner);
            if (!existingPartner) {
                await logActivity("Failed to Update Event", req.user.id, { reason: "Partner not found", partner: updates.partner });
                return res.status(404).json({ error: "Partner not found." });
            }
        }

        // Update the event by ID
        const updatedEvent = await EventModel.findByIdAndUpdate(eventId, updates, { new: true }).populate("partner", "name email");

        if (!updatedEvent) {
            await logActivity("Failed to Update Event", req.user.id, { reason: "Event not found", eventId });
            return res.status(404).json({ error: "Event not found." });
        }

        await logActivity("Updated Event", req.user.id, { eventId, updates });

        res.json(updatedEvent);
    } catch (err) {
        await logActivity("Error in updateEvent", req.user.id, { error: err.message });
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
          await logActivity("Failed to Delete Event", req.user.id, { reason: "Event not found", eventId });
          return res.status(404).json({ error: "Event not found." });
      }

      await logActivity("Deleted Event", req.user.id, { eventId, title: deletedEvent.title });

      res.status(204).send();
  } catch (err) {
      await logActivity("Error in deleteEvent", req.user.id, { error: err.message });
      res.status(400).json({ error: err.message });
  }
};
