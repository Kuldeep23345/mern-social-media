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

  // Close dropdown when clicking outside
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
      // Navigate to post or open post dialog
      navigate("/");
      // You can dispatch an action to open the post dialog here
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
      className="w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[60] max-h-[500px] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Notifications</h2>
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
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Heart className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification, index) => (
              <div
                key={index}
                onClick={() => handleNotificationClick(notification)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage
                      src={notification.sender?.profilePicture}
                      alt={notification.sender?.username}
                    />
                    <AvatarFallback>
                      {notification.sender?.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          <span className="font-semibold">
                            {notification.sender?.username || "Someone"}
                          </span>{" "}
                          {notification.message || "interacted with your content"}
                        </p>
                        {notification.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
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

