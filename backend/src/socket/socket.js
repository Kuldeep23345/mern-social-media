import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

let io;

const onlineUsers = new Map();

export const initializeSocket = (server) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  io = new Server(server, {
    cors: {
      origin: frontendUrl,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  console.log(`Socket.IO initialized with CORS origin: ${frontendUrl}`);

  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Fallback: read token from cookies on the websocket handshake
      if (!token && socket.handshake.headers?.cookie) {
        const rawCookies = socket.handshake.headers.cookie.split(";");
        for (const cookie of rawCookies) {
          const [name, value] = cookie.trim().split("=");
          if (name === "token") {
            token = value;
            break;
          }
        }
      }

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        return next(new Error("Authentication error"));
      }

      const user = await User.findById(decoded._id).select("-password");
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    onlineUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      user: socket.user,
    });

    socket.join(socket.userId);

    io.emit("userOnline", {
      userId: socket.userId,
      username: socket.user.username,
    });

    socket.emit("onlineUsers", Array.from(onlineUsers.values()));

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
    });

    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
    });
    socket.on("sendMessage", async (data) => {
      try {
        const { receiverId, message, conversationId } = data;

        // Create room ID from both user IDs (sorted for consistency)
        const roomId = [socket.userId, receiverId].sort().join("-");

        // Emit to the room (both users will receive it)
        const payload = {
          senderId: socket.userId,
          receiverId,
          message,
          conversationId,
          sender: {
            _id: socket.user._id,
            username: socket.user.username,
            profilePicture: socket.user.profilePicture,
          },
          createdAt: new Date(),
        };

        io.to(roomId).emit("newMessage", payload);

        io.to(roomId).emit("newMessage", payload);
      } catch (error) {
        console.log("Error in sendMessage:", error);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    socket.on("typing", (data) => {
      const { receiverId, isTyping } = data;
      const roomId = [socket.userId, receiverId].sort().join("-");
      socket.to(roomId).emit("userTyping", {
        senderId: socket.userId,
        isTyping,
        username: socket.user.username,
      });
    });

    socket.on("sendNotification", (data) => {
      const { receiverId, type, message, postId } = data;

      io.to(receiverId).emit("newNotification", {
        senderId: socket.userId,
        receiverId,
        type, // 'like', 'comment', 'follow', 'message'
        message,
        postId,
        sender: {
          _id: socket.user._id,
          username: socket.user.username,
          profilePicture: socket.user.profilePicture,
        },
        createdAt: new Date(),
      });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.userId);
      io.emit("userOffline", {
        userId: socket.userId,
      });

      // Clear typing status in all rooms the user was in
      socket.rooms.forEach((roomId) => {
        if (roomId !== socket.id && roomId !== socket.userId) {
          socket.to(roomId).emit("userTyping", {
            senderId: socket.userId,
            isTyping: false,
            username: socket.user?.username,
          });
        }
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};
