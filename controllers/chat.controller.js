// const Chat = require('../models/Chat');
// const User = require('../models/User');

const BasicInfoModel = require("../models/BasicInfo.model");
const chatModel = require("../models/chat.model");
const profileModels = require("../models/profile.models");
const userModel = require("../models/userModel");
const Joi = require("joi");
// Validation schema for creating a chat
const createChatSchema = Joi.object({
  partnerId: Joi.string().required(),
});
// Search partners and list all if no query
exports.searchPartners = async (req, res) => {
  const { query } = req.query;
  const userId = req.user.id; // ID of the logged-in user
  const userRole = req.user.role; // Role of the logged-in user

  try {
    let result;

    if (userRole === "ADMIN") {
      // Fetch all partners if the user is an admin
      const filter = {
        role: "PARTNER",
      };

      if (query) {
        filter.$or = [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ];
      }

      const partners = await userModel.find(filter);

      // Enrich partner details
      result = await Promise.all(
        partners.map(async (partner) => {
          // Fetch basic info using the user ID
          const basicInfo = await profileModels.findOne({ user: partner._id }).lean();

          // Fetch chat details
          const chat = await chatModel.findOne({
            admin: userId,
            partner: partner._id,
          })
            .select("lastMessage lastMessageTimestamp messages")
            .lean();

          // Calculate unread messages
          const unreadCount = chat
            ? chat.messages.filter((msg) => !msg.read && msg.sender.toString() !== userId).length
            : 0;

          return {
            ...partner.toObject(),
            basicInfo: basicInfo || null,
            chat: chat
              ? {
                  lastMessage: chat.lastMessage,
                  lastMessageTimestamp: chat.lastMessageTimestamp,
                  unreadCount,
                }
              : null,
          };
        })
      );
    } else if (userRole === "PARTNER") {
      // Fetch only the admin if the user is a partner
      const admin = await userModel.findOne({ role: "ADMIN" });

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Fetch chat details
      const chat = await chatModel.findOne({
        admin: admin._id,
        partner: userId,
      })
        .select("lastMessage lastMessageTimestamp messages")
        .lean();

      // Calculate unread messages
      const unreadCount = chat
        ? chat.messages.filter((msg) => !msg.read && msg.sender.toString() !== userId).length
        : 0;

      // Enrich admin details
      result = [
        {
          ...admin.toObject(),
          basicInfo: null, // Assuming admins don't have basicInfo
          chat: chat
            ? {
                lastMessage: chat.lastMessage,
                lastMessageTimestamp: chat.lastMessageTimestamp,
                unreadCount,
              }
            : null,
        },
      ];
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    // Sort the result by lastMessageTimestamp (newest first)
    result.sort((a, b) => {
      const timestampA = a.chat?.lastMessageTimestamp || 0;
      const timestampB = b.chat?.lastMessageTimestamp || 0;
      return timestampB - timestampA; // Newest messages first
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching partners or admin:", error);
    res.status(500).json({ message: "Failed to fetch partners or admin", error });
  }
};





// Create a new chat
exports.createChat = async (req, res) => {
  const { error } = createChatSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { partnerId } = req.body;
  const adminId = req.user.id;

  try {
    const existingChat = await chatModel.findOne({ admin: adminId, partner: partnerId });

    if (existingChat) {
      return res.status(400).json({ message: "Chat already exists" });
    }

    const chat = new chatModel({ admin: adminId, partner: partnerId });
    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: "Failed to create chat", error: err });
  }
};

// Fetch all chats for the logged-in user
exports.getChatMessages = async (req, res) => {
  const userId = req.user.id; // Current logged-in user
  const { recieverId } = req.params; // Partner or admin ID from the route parameter

  try {
    // Fetch the chat between the current user and the specified recipient
    const chat = await chatModel.findOne({
      $or: [
        { admin: userId, partner: recieverId },
        { admin: recieverId, partner: userId },
      ],
    }).populate([
      { path: "admin", select: "name email" },
      { path: "partner", select: "name email" },
    ]);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found." });
    }

    res.json(chat.messages); // Return only the messages
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    res.status(500).json({ message: "Failed to fetch chat messages", error });
  }
};



// Add a message to a chat
exports.addMessage = async (req, res) => {
  const { recieverId } = req.params; // Receiver ID from the route
  const { content } = req.body; // Content of the message
  const senderId = req.user.id; // Authenticated user ID

  try {
    // Check if a chat already exists between the sender and receiver
    let chat = await chatModel.findOne({
      $or: [
        { admin: senderId, partner: recieverId },
        { admin: recieverId, partner: senderId },
      ],
    });

    if (!chat) {
      // If chat doesn't exist, create a new chat
      chat = new chatModel({
        admin: senderId,
        partner: recieverId,
        messages: [],
        lastMessageTimestamp: Date.now(),
      });

      await chat.save();
      console.log("New chat created:", chat._id);
    } else {
      console.log("Existing chat found:", chat._id);
    }

    // Add the new message to the chat
    const newMessage = {
      sender: senderId,
      content,
      timestamp: Date.now(),
    };

    chat.messages.push(newMessage);
    chat.lastMessage = content;
    chat.lastMessageTimestamp = Date.now();

    await chat.save();

    // Emit the new message event via Socket.io
    const io = req.app.get("socketio");
    if (io) {
      io.to(chat._id.toString()).emit("newMessage", newMessage);
    } else {
      console.error("Socket.io instance not found");
    }

    res.status(201).json({
      message: "Message sent successfully.",
      chatId: chat._id,
      newMessage,
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    res.status(500).json({ message: "Failed to send message", error });
  }
};



// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id; // Authenticated user ID

  try {
    const chat = await chatModel.findOne({
      $or: [
        { admin: userId, partner: chatId },
        { admin: chatId, partner: userId },
      ],
    });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found." });
    }

    let updated = false;
    chat.messages.forEach((message) => {
      if (!message.read && message.sender.toString() !== userId) {
        message.read = true;
        updated = true;
      }
    });

    if (updated) {
      await chat.save();
    }

    res.status(200).json({ message: "Messages marked as read." });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read.", error });
  }
};

// Get chats with unread count
exports.getChatsWithUnreadCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const chats = await chatModel.find({
      $or: [{ admin: userId }, { partner: userId }],
    });

    const result = chats.map((chat) => {
      const unreadCount = chat.messages.filter(
        (msg) => !msg.read && msg.sender.toString() !== userId
      ).length;

      return {
        ...chat.toObject(),
        unreadCount,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching chats with unread count:", error);
    res.status(500).json({ message: "Failed to fetch chats.", error });
  }
};
