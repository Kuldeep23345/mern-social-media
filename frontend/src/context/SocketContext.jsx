import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user } = useSelector((store) => store.auth);

  useEffect(() => {
    if (!user) return;

    // Get Socket.IO URL from environment or use default
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";
    
    console.log(`Connecting to Socket.IO server at: ${SOCKET_URL}`);

    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket.IO connected successfully:", newSocket.id);
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/2298cefe-44eb-4932-95fe-e57982e88dd6", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "pre-fix",
          hypothesisId: "H1",
          location: "frontend/src/context/SocketContext.jsx:connect",
          message: "Socket connected on client",
          data: { socketId: newSocket.id, userId: user?._id },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected:", reason);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error.message);
      console.error("Error details:", error);
      
      // Show user-friendly error message
      if (error.message.includes("Authentication")) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error("Failed to connect to server. Please check your connection.");
      }
    });

    // Handle online users
    newSocket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("userOnline", (data) => {
      setOnlineUsers((prev) => {
        const exists = prev.find((u) => u.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    newSocket.on("userOffline", (data) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    // Handle notifications
    newSocket.on("newNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      
      // Show toast notification with different styles based on type
      const getToastConfig = () => {
        switch (notification.type) {
          case "like":
            return {
              message: notification.message || "Someone liked your post",
              icon: "❤️",
            };
          case "comment":
            return {
              message: notification.message || "Someone commented on your post",
              icon: "💬",
            };
          case "follow":
            return {
              message: notification.message || "Someone started following you",
              icon: "👤",
            };
          default:
            return {
              message: notification.message || "You have a new notification",
              icon: "🔔",
            };
        }
      };

      const config = getToastConfig();
      
      toast.success(`${config.icon} ${config.message}`, {
        duration: 4000,
        description: notification.sender?.username
          ? `From ${notification.sender.username}`
          : undefined,
      });

      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/2298cefe-44eb-4932-95fe-e57982e88dd6", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "pre-fix",
          hypothesisId: "H3",
          location: "frontend/src/context/SocketContext.jsx:newNotification",
          message: "Client received newNotification",
          data: { type: notification.type, count: notifications.length + 1 },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  const value = {
    socket,
    onlineUsers,
    notifications,
    setNotifications,
    isUserOnline: (userId) => {
      if (!userId) return false;
      const userIdStr = userId.toString();
      return onlineUsers.some((u) => {
        const onlineUserIdStr = u.userId?.toString() || u.userId;
        return onlineUserIdStr === userIdStr;
      });
    },
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

