import {
  Heart,
  Home,
  LogOut,
  MessageCircle,
  PlusSquare,
  Search,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import instance from "@/lib/axios.instance";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "@/redux/authSlice";
import { useState } from "react";
import CreatePost from "./CreatePost";
import { setPosts, setSlectedPost } from "@/redux/postSlice";
import { useSocket } from "@/context/SocketContext";
import NotificationDropdown from "./NotificationDropdown";

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const { notifications } = useSocket();
  const sidebarItems = [
    {
      icon: <Home />,
      text: "Home",
      link: "/",
    },
    {
      icon: <Search />,
      text: "Search",
      link: null,
    },
    {
      icon: <TrendingUp />,
      text: "Explore",
      link: null,
    },
    {
      icon: <MessageCircle />,
      text: "Message",
      link: "/chat",
    },
    {
      icon: (
        <div className="relative">
          <Heart />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
        </div>
      ),
      text: "Notifications",
      link: null,
      isNotification: true,
    },
    {
      icon: <PlusSquare />,
      text: "Create",
      link: null,
    },
    {
      icon: (
        <Avatar>
          <AvatarImage className={"object-cover"} src={user?.profilePicture} />
          <AvatarFallback>
            {user?.username?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
      text: "Profile",
      link: null,
    },
    {
      icon: <LogOut />,
      text: "Logout",
      link: null,
    },
  ];
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
      console.log(error);
      toast.error(error?.data?.response?.message);
    }
  };

  const sidebarHandler = (item) => {
    if (item.link) {
      navigate(item.link);
      setMobileMenuOpen(false);
    } else if (item.text.toLowerCase() == "logout") {
      logoutHandler();
      setMobileMenuOpen(false);
    } else if (item.text.toLowerCase() == "create") {
      setOpen(true);
      setMobileMenuOpen(false);
    } else if (item.text.toLowerCase() == "profile") {
      navigate(`/profile/${user?._id}`);
      setMobileMenuOpen(false);
    } else if (item.isNotification) {
      setNotificationOpen(!notificationOpen);
      setMobileMenuOpen(false);
    } else {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <section
        className={`w-[240px] fixed h-screen top-0 bottom-0 left-0 z-40 border-r border-gray-300/40 bg-white dark:bg-gray-900 transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col gap-8 pl-10 mt-28">
          {sidebarItems.map((item, index) => (
            <div
              key={index}
              className={`relative ${item.isNotification ? "z-[55]" : ""}`}
            >
              <div
                onClick={() => sidebarHandler(item)}
                className={`flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors ${
                  item.isNotification && notificationOpen
                    ? "bg-gray-100 dark:bg-gray-800"
                    : ""
                }`}
              >
                {item.icon}
                <span>{item.text}</span>
              </div>
              {item.isNotification && (
                <div className="absolute top-full left-0 mt-2">
                  <NotificationDropdown
                    isOpen={notificationOpen}
                    onClose={() => setNotificationOpen(false)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <CreatePost open={open} setOpen={setOpen} />
      </section>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
