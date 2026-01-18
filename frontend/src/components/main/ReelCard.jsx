import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Music,
  Share2,
  Volume2,
  VolumeX,
  Bookmark,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import instance from "@/lib/axios.instance";
import { toast } from "sonner";
import CommentDialog from "./CommentDialog";
import { setAuthUser, setUserProfile } from "@/redux/authSlice";
import { setPosts, setSlectedPost } from "@/redux/postSlice";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const ReelCard = ({ reel }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { user, userProfile } = useSelector((state) => state.auth);
  const [liked, setLiked] = useState(reel?.likes?.includes(user?._id) || false);
  const [open, setOpen] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { posts } = useSelector((state) => state.posts);
  const [downloading, setDownloading] = useState(false);

  const isLoggedInUserProfile = user?._id === reel?.author?._id;
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (user && reel?.author) {
      setIsFollowing(user.following?.includes(reel.author._id));
    }
  }, [user, reel?.author]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.7,
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    if (videoRef.current) observer.observe(videoRef.current);

    return () => {
      if (videoRef.current) observer.unobserve(videoRef.current);
    };
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const likeHandler = async () => {
    try {
      const res = await instance.get(
        `/post/${reel._id}/${liked ? "dislike" : "like"}`,
      );
      if (res.data.success) {
        setLiked(!liked);
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const bookmarkHandler = async () => {
    try {
      const res = await instance.get(`/post/${reel?._id}/bookmark`);
      if (res.data.success) {
        toast.success(res.data.message);
        const isBookmarked = user.bookmarks?.includes(reel._id);
        const updatedBookmarks = isBookmarked
          ? user.bookmarks.filter((id) => id !== reel._id)
          : [...(user.bookmarks || []), reel._id];
        dispatch(setAuthUser({ ...user, bookmarks: updatedBookmarks }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  const handleFollowUnfollow = async (e) => {
    e.stopPropagation();
    if (!user) return toast.error("Please login to follow");
    if (isLoggedInUserProfile) return;

    setFollowLoading(true);
    try {
      const res = await instance.post(
        `/user/followorunfollow/${reel.author._id}`,
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setIsFollowing(!isFollowing);

        // Update user's following list in Redux
        const updatedFollowing = isFollowing
          ? user.following.filter((id) => id !== reel.author._id)
          : [...(user.following || []), reel.author._id];

        dispatch(setAuthUser({ ...user, following: updatedFollowing }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to follow/unfollow");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleProfileVisit = (e) => {
    e.stopPropagation();
    navigate(`/profile/${reel.author._id}`);
  };

  const downloadVideo = async (e) => {
    if (e) e.stopPropagation();
    setDownloading(true);
    setMoreOptionsOpen(false);
    try {
      const response = await fetch(reel.video);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reel-${reel._id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download video");
    } finally {
      setDownloading(false);
    }
  };

  const deleteReelHandler = async () => {
    try {
      const res = await instance.delete(`/post/delete/${reel?._id}`);
      if (res.data.success) {
        const updatedPostData = posts.filter(
          (postItem) => postItem?._id !== reel?._id,
        );
        dispatch(setPosts(updatedPostData));
        toast.success(res.data.message);
        setMoreOptionsOpen(false);
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center snap-start bg-white relative md:pb-0 pb-16">
      <div className="relative h-full w-full max-w-[450px] flex items-center justify-center bg-white shadow-sm ring-1 ring-gray-100">
        <video
          ref={videoRef}
          onClick={handlePlayPause}
          src={reel.video}
          className="h-full w-full object-contain cursor-pointer bg-black"
          loop
          muted={isMuted}
          playsInline
        />

        {/* Global Sound Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="absolute top-6 right-6 p-2 bg-black/40 rounded-full text-white backdrop-blur-md z-10 hover:bg-black/60 transition-all"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        {/* Overlay Info (Bottom) */}
        <div className="absolute bottom-4 left-4 right-16 z-10">
          <div className="flex items-center gap-3 mb-4 group cursor-pointer w-fit">
            <Avatar
              onClick={handleProfileVisit}
              className="w-8 h-8 ring-2 ring-white/50 group-hover:ring-white transition-all"
            >
              <AvatarImage
                src={reel.author?.profilePicture}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {reel.author?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span
                onClick={handleProfileVisit}
                className="font-bold text-sm text-white drop-shadow-lg hover:underline decoration-white/50"
              >
                {reel.author?.username}
              </span>
              {!isLoggedInUserProfile && (
                <>
                  <div className="w-1 h-1 bg-white rounded-full shadow-lg" />
                  <button
                    onClick={handleFollowUnfollow}
                    disabled={followLoading}
                    className={`text-xs font-bold transition-colors ${isFollowing ? "text-gray-300" : "text-[#0095F6] hover:text-white"}`}
                  >
                    {followLoading
                      ? "..."
                      : isFollowing
                        ? "Following"
                        : "Follow"}
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-white drop-shadow-md mb-4 leading-snug line-clamp-2 pr-4">
            {reel.caption}
          </p>
          <div className="flex items-center gap-2 bg-black/30 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            <Music className="w-3 h-3 text-white animate-pulse" />
            <span className="text-[10px] text-white font-medium">
              Original Audio • {reel.author?.username}
            </span>
          </div>
        </div>

        {/* Floating Side Actions */}
        <div className="absolute right-3 bottom-20 flex flex-col gap-6 items-center z-10">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                likeHandler();
              }}
              className="p-3 bg-white hover:bg-gray-100 rounded-full transition-all active:scale-125 shadow-md border border-gray-100"
            >
              <Heart
                className={`w-7 h-7 ${liked ? "fill-red-500 text-red-500" : "text-gray-800"}`}
              />
            </button>
            <span className="text-gray-900 text-[11px] font-bold drop-shadow-sm bg-white/50 px-2 rounded-full">
              {reel.likes.length +
                (liked && !reel.likes.includes(user?._id) ? 1 : 0)}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                dispatch(setSlectedPost(reel));
                setOpen(true);
              }}
              className="p-3 bg-white hover:bg-gray-100 rounded-full transition-all shadow-md border border-gray-100"
            >
              <MessageCircle className="w-7 h-7 text-gray-800" />
            </button>
            <span className="text-gray-900 text-[11px] font-bold drop-shadow-sm bg-white/50 px-2 rounded-full">
              {reel.comments.length}
            </span>
          </div>

          <button className="p-3 bg-white hover:bg-gray-100 rounded-full transition-all shadow-md border border-gray-100">
            <Share2 className="w-7 h-7 text-gray-800" />
          </button>

          <button
            onClick={bookmarkHandler}
            className="p-3 bg-white hover:bg-gray-100 rounded-full transition-all shadow-md border border-gray-100"
          >
            <Bookmark
              className={`w-7 h-7 ${user?.bookmarks?.includes(reel?._id) ? "fill-black text-black" : "text-gray-800"}`}
            />
          </button>

          <Dialog open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
            <DialogTrigger asChild>
              <button className="p-3 bg-white hover:bg-gray-100 rounded-full transition-all shadow-md border border-gray-100">
                {downloading ? (
                  <Loader2 className="w-7 h-7 text-gray-800 animate-spin" />
                ) : (
                  <MoreHorizontal className="w-7 h-7 text-gray-800" />
                )}
              </button>
            </DialogTrigger>
            <DialogContent className="px-0 py-4 flex items-center flex-col max-w-[300px] rounded-xl">
              <Button
                variant="ghost"
                className="w-full text-[#0095F6] font-bold py-3 border-b rounded-none"
                onClick={downloadVideo}
              >
                Download Video
              </Button>
              {isLoggedInUserProfile && (
                <Button
                  variant="ghost"
                  className="w-full text-[#ED4956] font-bold py-3 border-b rounded-none"
                  onClick={deleteReelHandler}
                >
                  Delete
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full py-3 rounded-none"
                onClick={() => setMoreOptionsOpen(false)}
              >
                Cancel
              </Button>
            </DialogContent>
          </Dialog>

          <div className="w-8 h-8 rounded-lg border-2 border-white/50 overflow-hidden">
            <img
              src={reel.author?.profilePicture}
              className="w-full h-full object-cover"
              alt="audio-thumb"
            />
          </div>
        </div>
      </div>
      <CommentDialog open={open} setOpen={setOpen} />
    </div>
  );
};

export default ReelCard;
