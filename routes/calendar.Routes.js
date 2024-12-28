const express = require('express');
const passport = require('passport');
const { getAllEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/Event.controller');
// const {
//   createChat,
//   getChats,
//   addMessage,
// } = require('../controllers/chat.controller');
const router = express.Router();
// const {
//     createEvent,
//     getAllEvents,
//     updateEvent,
//     deleteEvent,
//   } = require("../controllers/calendarController");

  router
    .route("/")
    .get(passport.authenticate("jwt", { session: false }), getAllEvents)
    .post(passport.authenticate("jwt", { session: false }), createEvent);

  router
    .route("/:eventId")
    .put(passport.authenticate("jwt", { session: false }), updateEvent)
    .delete(passport.authenticate("jwt", { session: false }), deleteEvent);

  module.exports = router;