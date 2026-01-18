import React, { useState } from "react";
import { Heart, LogOut, Menu, X } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import NotificationDropdown from "./NotificationDropdown";
import { Link, useNavigate } from "react-router-dom";
import instance from "@/lib/axios.instance";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "@/redux/authSlice";
import { setPosts, setSlectedPost } from "@/redux/postSlice";

const MobileHeader = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { notifications } = useSocket();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const logoutHandler = async () => {
    try {
      const res = await instance.get("/user/logout");
      if (res.data.success) {
        toast.success(res?.data?.message);
        navigate("/login");
        dispatch(setAuthUser(null));
        dispatch(setSlectedPost(null));
        dispatch(setPosts([]));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

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

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 active:scale-95 transition-transform"
        >
          {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
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

      {menuOpen && (
        <div className="fixed top-16 right-0 z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-right-2 duration-300 shadow-lg">
          <button
            onClick={logoutHandler}
            className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 w-full text-left transition-colors text-red-600 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
