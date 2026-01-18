import React, { useState, useRef, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { Avatar, AvatarImage } from "../ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { Heart, MessageCircle, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { notifications, setNotifications } = useSocket();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      default:
        return <Heart className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === "follow") {
      navigate(`/profile/${notification.senderId}`);
    } else if (notification.postId) {
      navigate("/");
    }
    onClose();
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="w-full md:max-w-sm md:w-[420px] bg-white dark:bg-gray-900 backdrop-blur-2xl md:rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border-t md:border border-white/20 dark:border-gray-800/50 z-[60] h-full md:max-h-[640px] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/5"
    >
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Heart className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="py-2">
            {notifications.map((notification, index) => (
              <div
                key={index}
                onClick={() => handleNotificationClick(notification)}
                className="p-4 mx-2 my-1 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-200 group animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 flex-shrink-0 ring-2 ring-transparent group-hover:ring-[#0095F6]/20 transition-all">
                    <AvatarImage
                      src={notification.sender?.profilePicture}
                      alt={notification.sender?.username}
                    />
                    <AvatarFallback>
                      {(
                        notification.sender?.name ||
                        notification.sender?.username
                      )
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          <span className="font-semibold">
                            {notification.sender?.name ||
                              notification.sender?.username ||
                              "Someone"}
                          </span>{" "}
                          {notification.message ||
                            "interacted with your content"}
                        </p>
                        {notification.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
