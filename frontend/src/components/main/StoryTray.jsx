import React from "react";
import { Plus, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import instance from "@/lib/axios.instance";
import { setStories } from "@/redux/postSlice";
import { toast } from "sonner";
import StoryViewer from "./StoryViewer";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const StoryTray = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const { stories = [] } = useSelector((store) => store.posts);
  const [loading, setLoading] = React.useState(false);
  const [selectedUserStories, setSelectedUserStories] = React.useState(null);
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await instance.get("/story/all");
        if (res.data.success) {
          dispatch(setStories(res.data.stories));
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
      }
    };
    fetchStories();
  }, [dispatch, user?.following]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await instance.post("/story/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        toast.success(res.data.message);
        const updatedRes = await instance.get("/story/all");
        if (updatedRes.data.success) {
          dispatch(setStories(updatedRes.data.stories));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add story");
    } finally {
      setLoading(false);
    }
  };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };

  const handleStoryClick = (item) => {
    if (item.stories?.length > 0) {
      setSelectedUserStories(item);
    } else if (item.author?._id === user?._id) {
      fileInputRef.current.click();
    }
  };

  const displayStories = [...stories].sort((a, b) => {
    if (a.author?._id === user?._id) return -1;
    if (b.author?._id === user?._id) return 1;
    return 0;
  });

  const userHasStory = stories.some((s) => s.author._id === user?._id);

  if (!userHasStory && user) {
    displayStories.unshift({
      author: user,
      stories: [],
      isUser: true,
    });
  }

  return (
    <div className="w-full flex gap-4 overflow-x-auto pb-6 px-1 scrollbar-none snap-x snap-mandatory">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileChange}
      />
      {displayStories.map((item, index) => (
        <div
          key={item.author?._id || index}
          onClick={() => handleStoryClick(item)}
          className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group snap-start"
        >
          <div
            className={`relative w-16 h-16 rounded-full p-[2px] ${item.stories?.length > 0 ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-fuchsia-600" : "bg-gray-200 dark:bg-gray-700"} group-hover:scale-105 transition-transform`}
          >
            <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Avatar className="w-full h-full">
                <AvatarImage
                  src={item.author?.profilePicture}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                  {item.author?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {item.author?._id === user?._id && (
              <div
                onClick={handlePlusClick}
                className="absolute bottom-0 right-0 bg-[#0095F6] rounded-full p-1 border-2 border-white dark:border-gray-900 cursor-pointer shadow-sm hover:bg-[#1877F2]"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <Plus className="w-3 h-3 text-white" />
                )}
              </div>
            )}
          </div>
          <span
            className={`text-[10px] font-medium truncate w-16 text-center ${item.author?._id === user?._id ? "text-gray-400" : "text-gray-700 dark:text-gray-300"}`}
          >
            {item.author?._id === user?._id
              ? "Your Story"
              : item.author?.username}
          </span>
        </div>
      ))}

      {selectedUserStories && (
        <StoryViewer
          userStories={selectedUserStories}
          onClose={() => setSelectedUserStories(null)}
        />
      )}
    </div>
  );
};

export default StoryTray;
