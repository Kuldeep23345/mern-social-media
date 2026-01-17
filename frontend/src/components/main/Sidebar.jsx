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
import SearchUser from "./SearchUser";

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
            {(user?.name || user?.username)?.charAt(0)?.toUpperCase()}
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
      toast.error(error?.response?.data?.message);
    }
  };

  const sidebarHandler = (item) => {
    if (item.link) {
      navigate(item.link);
    } else if (item.text.toLowerCase() == "logout") {
      logoutHandler();
    } else if (item.text.toLowerCase() == "create") {
      setOpen(true);
    } else if (item.text.toLowerCase() == "profile") {
      navigate(`/profile/${user?._id}`);
    } else if (item.isNotification) {
      setNotificationOpen(!notificationOpen);
      setSearchOpen(false);
    } else if (item.text.toLowerCase() === "search") {
      setSearchOpen(!searchOpen);
      setNotificationOpen(false);
    }
  };

  return (
    <section className="w-[240px] fixed h-screen top-0 bottom-0 left-0 z-40 border-r border-gray-300/40 bg-white dark:bg-gray-900">
      <div className="flex flex-col gap-8 px-6 mt-12 h-full overflow-y-auto pb-10">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tighter italic">Social</h1>
        </div>
        {sidebarItems.map((item, index) => (
          <div
            key={index}
            className={`relative ${item.isNotification ? "z-[55]" : ""}`}
          >
            <div
              onClick={() => sidebarHandler(item)}
              className={`flex items-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-3 rounded-xl transition-all duration-200 group ${
                (item.isNotification && notificationOpen) ||
                (item.text.toLowerCase() === "search" && searchOpen)
                  ? "bg-gray-100 dark:bg-gray-800 font-bold"
                  : ""
              }`}
            >
              <div className="group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </div>
              <span className="text-sm font-medium">{item.text}</span>
            </div>
            {item.isNotification && (
              <div className="fixed top-0 left-[240px] z-[60] py-6">
                <NotificationDropdown
                  isOpen={notificationOpen}
                  onClose={() => setNotificationOpen(false)}
                />
              </div>
            )}
            {item.text.toLowerCase() === "search" && (
              <div className="fixed top-0 left-[240px] z-[60] py-6">
                <SearchUser
                  isOpen={searchOpen}
                  onClose={() => setSearchOpen(false)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <CreatePost open={open} setOpen={setOpen} />
    </section>
  );
};

export default Sidebar;
