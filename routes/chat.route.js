const express = require('express');
const passport = require('passport');
const { createChat, addMessage, searchPartners, getChatMessages, markMessagesAsRead, getChatsWithUnreadCount } = require('../controllers/chat.controller');
// const {
//   createChat,
//   getChats,
//   addMessage,
// } = require('../controllers/chat.controller');
const router = express.Router();

// Create a new chat
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  createChat
);
router.get('/partners', passport.authenticate('jwt', { session: false }), searchPartners);

// Fetch all chats for the logged-in user
router.get(
  '/:recieverId/messages',
  passport.authenticate('jwt', { session: false }),
  getChatMessages
);

router.get(
  '/getChatsWithUnreadCount',
  passport.authenticate('jwt', { session: false }),
  getChatsWithUnreadCount
);
// Add a message to a chat
router.post(
  '/:recieverId/messages',
  passport.authenticate('jwt', { session: false }),
  addMessage
);
// Mark messages as read
router.patch("/:chatId/read",  passport.authenticate('jwt', { session: false }), markMessagesAsRead);


module.exports = router;
