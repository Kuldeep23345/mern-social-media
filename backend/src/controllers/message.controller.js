import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getIO } from "../socket/socket.js";
import { User } from "../models/user.model.js";

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;

    const { message } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const sender = await User.findById(senderId).select(
      "username profilePicture",
    );

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    if (newMessage) conversation.messages.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    // Emit Socket.IO event for real-time message
    try {
      const io = getIO();
      const roomId = [senderId.toString(), receiverId.toString()]
        .sort()
        .join("-");
      const payload = {
        senderId: senderId.toString(),
        receiverId: receiverId.toString(),
        message: newMessage.message,
        conversationId: conversation._id.toString(),
        sender: {
          _id: sender._id,
          username: sender.username,
          profilePicture: sender.profilePicture,
        },
        createdAt: newMessage.createdAt,
        _id: newMessage._id,
      };

      io.to(roomId).emit("newMessage", payload);

      // #endregion
    } catch (socketError) {
      console.log("Socket.IO error:", socketError);
      // Continue even if Socket.IO fails
    }

    return res
      .status(201)
      .json({ success: true, newMessage, conversationId: conversation._id });
  } catch (error) {
    console.log("Error in send message", error);
    return res.status(500).json({
      message: "Internal server error in send message",
      success: false,
    });
  }
};

const getMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate({
      path: "messages",
      populate: {
        path: "senderId",
        select: "username profilePicture",
      },
    });

    if (!conversation) {
      return res
        .status(200)
        .json({ success: true, messages: [], conversationId: null });
    }

    return res.status(200).json({
      success: true,
      messages: conversation.messages || [],
      conversationId: conversation._id,
    });
  } catch (error) {
    console.log("Error in get message", error);
    return res.status(500).json({
      message: "Internal server error in get message",
      success: false,
    });
  }
};

export { sendMessage, getMessage };
