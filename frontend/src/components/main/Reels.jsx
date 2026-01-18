import React, { useEffect, useState } from "react";
import instance from "@/lib/axios.instance";
import ReelCard from "./ReelCard";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "@/redux/postSlice";

const Reels = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { posts } = useSelector((store) => store.posts);
  const reels = posts?.filter((post) => post && post.postType === "reel") || [];

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res = await instance.get("/post/reels");
        if (res.data.success) {
          // Merge with existing posts to avoid duplicates and keep order
          const existingPostIds = new Set(posts.map((p) => p._id));
          const newReels = res.data.reels.filter(
            (r) => !existingPostIds.has(r._id),
          );
          dispatch(setPosts([...posts, ...newReels]));
        }
      } catch (error) {
        console.error("Error fetching reels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  if (loading && reels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-white">
      {reels.length > 0 ? (
        reels.map((reel) => <ReelCard key={reel._id} reel={reel} />)
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-black">
          <p className="text-xl font-semibold">No reels yet</p>
          <p className="text-gray-500">Be the first to upload one!</p>
        </div>
      )}
    </div>
  );
};

export default Reels;
