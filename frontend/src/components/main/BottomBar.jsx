import {
  Home,
  Search,
  PlusSquare,
  MessageCircle,
  Heart,
  Video,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import CreatePost from "./CreatePost";
import SearchUser from "./SearchUser";
import { useSocket } from "@/context/SocketContext";

const BottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((store) => store.auth);
  const { notifications } = useSocket();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const items = [
    {
      icon: <Home className={isActive("/") ? "fill-black" : ""} />,
      path: "/",
      label: "Home",
    },
    {
      icon: <Search className={isActive("/search") ? "stroke-[3px]" : ""} />,
      action: () => setSearchOpen(true),
      label: "Search",
    },
    {
      icon: <Video className={isActive("/reels") ? "stroke-[3px]" : ""} />,
      path: "/reels",
      label: "Reels",
    },
    {
      icon: <PlusSquare />,
      action: () => setCreateOpen(true),
      label: "Create",
    },
    {
      icon: (
        <div className="relative">
          <MessageCircle className={isActive("/chat") ? "fill-black" : ""} />
        </div>
      ),
      path: "/chat",
      label: "Messages",
    },
    {
      icon: (
        <Avatar className="w-6 h-6 border border-gray-200">
          <AvatarImage src={user?.profilePicture} />
          <AvatarFallback>
            {(user?.name || user?.username)?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
      path: `/profile/${user?._id}`,
      label: "Profile",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 px-2 z-50 pb-safe">
      {items.map((item, index) => (
        <div
          key={index}
          onClick={() => (item.action ? item.action() : navigate(item.path))}
          className="flex flex-col items-center justify-center p-2 cursor-pointer tap-highlight-transparent"
        >
          {item.icon}
        </div>
      ))}

      <CreatePost open={createOpen} setOpen={setCreateOpen} />

      {searchOpen && (
        <SearchUser
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          isMobileFullScreen={true}
        />
      )}
    </div>
  );
};

export default BottomBar;
