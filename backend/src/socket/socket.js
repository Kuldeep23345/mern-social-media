import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

let io;

// Store online users
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

  // Authentication middleware for Socket.IO
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
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/2298cefe-44eb-4932-95fe-e57982e88dd6",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: "debug-session",
              runId: "pre-fix",
              hypothesisId: "H1",
              location: "backend/src/socket/socket.js:token-missing",
              message: "Socket auth token missing",
              data: {},
              timestamp: Date.now(),
            }),
          }
        ).catch(() => {});
        // #endregion
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
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/2298cefe-44eb-4932-95fe-e57982e88dd6",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "debug-session",
            runId: "pre-fix",
            hypothesisId: "H1",
            location: "backend/src/socket/socket.js:auth-success",
            message: "Socket auth success",
            data: { userId: socket.userId },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion
      next();
    } catch (error) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/2298cefe-44eb-4932-95fe-e57982e88dd6",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "debug-session",
            runId: "pre-fix",
            hypothesisId: "H1",
            location: "backend/src/socket/socket.js:auth-error",
            message: "Socket auth error",
            data: { error: error?.message || "unknown" },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Add user to online users
    onlineUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      user: socket.user,
    });

    // Join user's personal room for notifications
    socket.join(socket.userId);

    // Emit online status to all clients
    io.emit("userOnline", {
      userId: socket.userId,
      username: socket.user.username,
    });

    // Send list of online users to the newly connected user
    socket.emit("onlineUsers", Array.from(onlineUsers.values()));

    // Handle join room (for private chat)
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    // Handle leave room
    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.userId} left room ${roomId}`);
    });

    // Handle send message
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

        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/2298cefe-44eb-4932-95fe-e57982e88dd6",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: "debug-session",
              runId: "pre-fix",
              hypothesisId: "H2",
              location: "backend/src/socket/socket.js:sendMessage",
              message: "Socket sendMessage emitted",
              data: { roomId, senderId: socket.userId, receiverId },
              timestamp: Date.now(),
            }),
          }
        ).catch(() => {});
        // #endregion
      } catch (error) {
        console.log("Error in sendMessage:", error);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { receiverId, isTyping } = data;
      const roomId = [socket.userId, receiverId].sort().join("-");
      socket.to(roomId).emit("userTyping", {
        senderId: socket.userId,
        isTyping,
        username: socket.user.username,
      });
    });

    // Handle notification (for likes, comments, follows, etc.)
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

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);

      // Emit offline status to all clients
      io.emit("userOffline", {
        userId: socket.userId,
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
