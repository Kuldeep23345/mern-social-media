import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { setPosts, setSlectedPost } from "@/redux/postSlice";
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
  const { posts } = useSelector((store) => store.posts);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) return;

    // Get Socket.IO URL from environment or use default
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {});

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error.message);
      console.error("Error details:", error);

      // Show user-friendly error message
      if (error.message.includes("Authentication")) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(
          "Failed to connect to server. Please check your connection.",
        );
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
    });

    // Handle real-time post updates (likes/dislikes/comments)
    newSocket.on("postUpdate", (data) => {
      const { postId, likes, comments } = data;
      dispatch((dispatch, getState) => {
        const { posts, selectedPost } = getState().posts;

        // Update posts list
        const updatedPosts = posts.map((p) => {
          if (p._id === postId) {
            return {
              ...p,
              ...(likes !== undefined && { likes }),
              ...(comments !== undefined && { comments }),
            };
          }
          return p;
        });
        dispatch(setPosts(updatedPosts));

        // Update selected post if it's the one that was updated
        if (selectedPost && selectedPost._id === postId) {
          dispatch(
            setSlectedPost({
              ...selectedPost,
              ...(likes !== undefined && { likes }),
              ...(comments !== undefined && { comments }),
            }),
          );
        }
      });
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
