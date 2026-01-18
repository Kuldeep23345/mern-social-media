import React, { useEffect, useState } from "react";
import instance from "@/lib/axios.instance";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";

const ReelTray = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res = await instance.get("/post/reels");
        if (res.data.success) {
          setReels(res.data.reels);
        }
      } catch (error) {
        console.error("Error fetching reels for tray:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-none">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex gap-4 overflow-x-auto pb-6 px-1 scrollbar-none snap-x snap-mandatory">
      {/* Create Reel Button */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group">
        <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
          <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Plus className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
        <span className="text-[10px] font-medium text-gray-500">New Reel</span>
      </div>

      {reels.map((reel) => (
        <div
          key={reel._id}
          onClick={() => navigate("/reels")}
          className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group snap-start"
        >
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-900 overflow-hidden">
              <img
                src={reel.author?.profilePicture}
                className="w-full h-full object-cover"
                alt={reel.author?.username}
              />
            </div>
          </div>
          <span className="text-[10px] font-medium truncate w-16 text-center">
            {reel.author?.username}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ReelTray;
