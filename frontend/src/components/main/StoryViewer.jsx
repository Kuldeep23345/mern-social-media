import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

const StoryViewer = ({ userStories, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const currentStory = userStories.stories[currentIndex];
  const isVideo = !!currentStory.video;

  useEffect(() => {
    setProgress(0);
    startTimer();
    return () => stopTimer();
  }, [currentIndex]);

  const startTimer = () => {
    stopTimer();
    const duration = isVideo ? 0 : 5000; // For images, 5 seconds. For videos, handled by onTimeUpdate.

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
            <MoreHorizontal className="w-5 h-5 cursor-pointer" />
            <X
              onClick={onClose}
              className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform"
            />
          </div>
        </div>

        {/* Story Content */}
        <div className="flex-1 flex items-center justify-center bg-zinc-900">
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
        </div>

        {/* Navigation Buttons */}
        <div
          className="absolute inset-y-0 left-0 w-1/4 z-10"
          onClick={handlePrev}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/4 z-10"
          onClick={handleNext}
        />

        <div className="hidden md:block absolute top-1/2 -left-16 -translate-y-1/2">
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}
        </div>
        <div className="hidden md:block absolute top-1/2 -right-16 -translate-y-1/2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={handleNext}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>

        {/* Footer/Quick Reply */}
        <div className="p-4 bg-gradient-to-t from-black/60 to-transparent pt-10">
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
