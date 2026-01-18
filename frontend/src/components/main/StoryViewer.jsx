import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { setStories } from "@/redux/postSlice";
import instance from "@/lib/axios.instance";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const StoryViewer = ({ userStories, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);

  // If userStories or stories are empty (e.g., after delete), close
  if (
    !userStories ||
    !userStories.stories ||
    userStories.stories.length === 0
  ) {
    onClose();
    return null;
  }

  const currentStory = userStories.stories[currentIndex];
  // Safety check if index is out of bounds
  if (!currentStory) {
    if (userStories.stories.length > 0) {
      setCurrentIndex(0);
      return null;
    } else {
      onClose();
      return null;
    }
  }

  const isVideo = !!currentStory.video;
  const isOwner = user?._id === currentStory.author?._id;

  useEffect(() => {
    // Disable body scroll
    document.body.style.overflow = "hidden";

    return () => {
      // Re-enable body scroll
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    setProgress(0);
    startTimer();
    return () => stopTimer();
  }, [currentIndex, userStories]);

  const startTimer = () => {
    stopTimer();
    const duration = isVideo ? 0 : 5000;

    if (!isVideo) {
      const interval = 50;
      const increment = (interval / duration) * 100;
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 100;
          }
          return prev + increment;
        });
      }, interval);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleNext = () => {
    if (currentIndex < userStories.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await instance.delete(`/story/delete/${currentStory._id}`);
      if (res.data.success) {
        toast.success(res.data.message);

        // Optimistic UI update approach or Refetch
        // Refetching to be safe and sync with Redux
        const updatedRes = await instance.get("/story/all");
        if (updatedRes.data.success) {
          dispatch(setStories(updatedRes.data.stories));
          // Since the prop 'userStories' won't automatically update locally inside this unmounted/remounted component easily without parent state update,
          // closing the viewer is the safest UX to prevent stale state.
          onClose();
        }
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error(error.response?.data?.message || "Failed to delete story");
    }
  };

  const onVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const onVideoEnded = () => {
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center pt-safe pb-safe">
      {/* Background Blur */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={currentStory.image || currentStory.author?.profilePicture}
          className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
          alt=""
        />
      </div>

      <div className="relative h-full max-h-[90vh] w-full max-w-[450px] bg-black md:rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Progress Bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
          {userStories.stories.map((_, index) => (
            <div
              key={index}
              className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    index === currentIndex
                      ? `${progress}%`
                      : index < currentIndex
                        ? "100%"
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-20 text-white">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border border-white/20">
              <AvatarImage
                src={userStories.author.profilePicture}
                className="object-cover"
              />
              <AvatarFallback>
                {userStories.author.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm drop-shadow-md">
              {userStories.author.username}
            </span>
            <span className="text-[10px] opacity-70 drop-shadow-md">
              {new Date(currentStory.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Dialog
                onOpenChange={(open) => {
                  if (open) stopTimer();
                  else startTimer();
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full hover:bg-white/20 text-white"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 border-none bg-transparent shadow-none w-fit">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex items-center gap-2 font-bold ring-2 ring-white"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Story
                  </Button>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full hover:bg-white/20 text-white"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Story Content */}
        <div className="flex-1 flex items-center justify-center bg-zinc-900 relative">
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.video}
              autoPlay
              playsInline
              onTimeUpdate={onVideoTimeUpdate}
              onEnded={onVideoEnded}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={currentStory.image}
              className="w-full h-full object-contain"
              alt="Story"
            />
          )}

          {/* Navigation Overlays */}
          <div
            className="absolute inset-y-0 left-0 w-[15%] z-10 flex items-center justify-start pl-2 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          >
            {currentIndex > 0 && (
              <div className="p-2 bg-black/20 rounded-full backdrop-blur-sm text-white/70 group-hover:bg-black/40 group-hover:text-white transition-all">
                <ChevronLeft className="w-6 h-6" />
              </div>
            )}
          </div>
          <div
            className="absolute inset-y-0 right-0 w-[15%] z-10 flex items-center justify-end pr-2 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            <div className="p-2 bg-black/20 rounded-full backdrop-blur-sm text-white/70 group-hover:bg-black/40 group-hover:text-white transition-all">
              <ChevronRight className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Footer/Quick Reply */}
        <div className="p-4 bg-gradient-to-t from-black/60 to-transparent pt-10 z-20">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Reply to ${userStories.author.username}...`}
              className="flex-1 bg-transparent border border-white/40 rounded-full px-4 py-2 text-white text-sm outline-none placeholder:text-white/60 focus:border-white transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
