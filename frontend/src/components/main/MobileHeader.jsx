import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import NotificationDropdown from "./NotificationDropdown";
import { Link } from "react-router-dom";

const MobileHeader = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { notifications } = useSocket();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between z-40 md:hidden pt-safe">
      <Link to="/" className="text-xl font-bold italic tracking-tighter">
        Social
      </Link>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setNotificationOpen(!notificationOpen)}
          className="relative p-2 active:scale-95 transition-transform"
        >
          <Heart
            className={`w-7 h-7 ${notificationOpen ? "fill-black dark:fill-white" : ""}`}
          />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-900">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
        </button>
      </div>

      {notificationOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-white dark:bg-gray-900 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <NotificationDropdown
            isOpen={notificationOpen}
            onClose={() => setNotificationOpen(false)}
          />
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
