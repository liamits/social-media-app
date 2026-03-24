const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getReceiverSocketId } = require('../socket/socket');

const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    // This will run in parallel
    await Promise.all([conversation.save(), newMessage.save()]);

    // Socket.io for real-time
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      const io = req.app.get('io');
      io.to(receiverSocketId).emit('newMessage', {
        _id: newMessage._id,
        senderId: newMessage.senderId.toString(),
        receiverId: newMessage.receiverId.toString(),
        message: newMessage.message,
        createdAt: newMessage.createdAt,
        updatedAt: newMessage.updatedAt,
      });
    }

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] }
    }).populate('messages');

    if (!conversation) return res.status(200).json([]);

    res.status(200).json(conversation.messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({
      participants: { $in: [userId] }
    }).populate('participants', 'username avatar fullName');

    // Remove the current user from the participants list for each conversation
    const filteredConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);
      return {
        ...conv._doc,
        otherParticipant
      };
    });

    res.status(200).json(filteredConversations);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching conversations' });
  }
};

module.exports = { sendMessage, getMessages, getConversations };
