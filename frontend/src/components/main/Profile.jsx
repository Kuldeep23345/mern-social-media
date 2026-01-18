import useGetUserProfile from "@/hooks/useGetUserProfile";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage } from "../ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AtSign, Heart, MessageCircle } from "lucide-react";
import instance from "@/lib/axios.instance";
import { toast } from "sonner";
import { setAuthUser, setUserProfile } from "@/redux/authSlice";
import CommentDialog from "./CommentDialog";
import { setSlectedPost } from "@/redux/postSlice";

const Profile = () => {
  const params = useParams();
  const userId = params.id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useGetUserProfile(userId);
  const [activeTab, setActiveTab] = useState("posts");
  const [savedTab, setSavedTab] = useState("all");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { userProfile, user } = useSelector((store) => store.auth);
  const isLoggedInUserProfile = user?._id === userProfile?._id;

  React.useEffect(() => {
    if (user && userProfile && !isLoggedInUserProfile) {
      const following =
        user.following?.some(
          (id) => id?.toString() === userProfile._id?.toString(),
        ) || false;
      setIsFollowing(following);
    }
  }, [user, userProfile, isLoggedInUserProfile]);

  const handleFollowUnfollow = async () => {
    if (!user || !userProfile || isLoggedInUserProfile) return;

    setLoading(true);
    try {
      const res = await instance.post(
        `/user/followorunfollow/${userProfile._id}`,
      );
      if (res.data.success) {
        toast.success(res.data.message);

        setIsFollowing(!isFollowing);

        if (user.following) {
          const updatedFollowing = isFollowing
            ? user.following.filter(
                (id) => id?.toString() !== userProfile._id?.toString(),
              )
            : [...user.following, userProfile._id];

          dispatch(setAuthUser({ ...user, following: updatedFollowing }));
        }

        if (userProfile.followers) {
          const updatedFollowers = isFollowing
            ? userProfile.followers.filter(
                (id) => id?.toString() !== user._id?.toString(),
              )
            : [...userProfile.followers, user._id];

          dispatch(
            setUserProfile({ ...userProfile, followers: updatedFollowers }),
          );
        }
      }
    } catch (error) {
      console.error("Error in follow/unfollow:", error);
      toast.error(
        error?.response?.data?.message || "Failed to follow/unfollow",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    navigate("/chat");
  };

  const handleTabchange = (tab) => {
    setActiveTab(tab);
  };

  const displayedPost = React.useMemo(() => {
    if (activeTab === "posts") {
      return (userProfile?.posts || []).filter((p) => p.postType === "post");
    } else if (activeTab === "reels") {
      return (userProfile?.posts || []).filter((p) => p.postType === "reel");
    } else if (activeTab === "saved") {
      const bookmarks = userProfile?.bookmarks || [];
      if (savedTab === "posts")
        return bookmarks.filter((p) => p.postType === "post");
      if (savedTab === "reels")
        return bookmarks.filter((p) => p.postType === "reel");
      return bookmarks;
    }
    return [];
  }, [userProfile, activeTab, savedTab]);

  const handlePostClick = (post) => {
    dispatch(setSlectedPost(post));
    setOpen(true);
  };

  return (
    <section className="max-w-4xl flex mx-auto pl-10 justify-center">
      <div className="flex flex-col gap-10 md:gap-20 p-4 md:p-8">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-0">
          <section className="flex items-center justify-center">
            <Avatar className={"h-36 w-36"}>
              <AvatarImage
                className={"object-cover"}
                src={userProfile?.profilePicture}
                alt="profilePhoto"
              ></AvatarImage>
              <AvatarFallback>Cn</AvatarFallback>
            </Avatar>
          </section>
          <section className="flex-1">
            <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
              <div className="flex flex-col">
                <h1 className="font-bold text-xl">
                  {userProfile?.name || userProfile?.username}
                </h1>
                <span className="text-gray-500 text-sm">
                  @{userProfile?.username}
                </span>
              </div>
              {isLoggedInUserProfile ? (
                <div className="flex gap-2">
                  <Link to={"/profile/edit"}>
                    <Button
                      className={"hover:bg-gray-200 h-8"}
                      variant={"secondary"}
                    >
                      Edit Profile
                    </Button>
                  </Link>
                  <Button
                    className={"hover:bg-gray-200 h-8"}
                    variant={"secondary"}
                  >
                    View archive
                  </Button>
                  <Button
                    className={"hover:bg-gray-200 h-8"}
                    variant={"secondary"}
                  >
                    Ad tools
                  </Button>
                </div>
              ) : isFollowing ? (
                <div className="flex gap-2">
                  <Button
                    variant={"secondary"}
                    className={"h-8"}
                    onClick={handleFollowUnfollow}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Unfollow"}
                  </Button>
                  <Button
                    className={"bg-[#0095F6] hover:bg-[#0070ba] h-8"}
                    onClick={handleMessage}
                  >
                    Message
                  </Button>
                </div>
              ) : (
                <Button
                  className={"bg-[#0095F6] hover:bg-[#0070ba] h-8"}
                  onClick={handleFollowUnfollow}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Follow"}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-6 my-4 text-sm whitespace-nowrap overflow-x-auto pb-2 md:pb-0">
              <p>
                <span className="font-semibold">
                  {userProfile?.posts?.length}
                </span>{" "}
                posts
              </p>
              <p
                onClick={() => navigate(`/profile/${userId}/followers`)}
                className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="font-semibold">
                  {userProfile?.followers?.length}
                </span>{" "}
                followers
              </p>
              <p
                onClick={() => navigate(`/profile/${userId}/following`)}
                className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="font-semibold">
                  {userProfile?.following?.length}
                </span>{" "}
                following
              </p>
            </div>
            <div className="flex flex-col">
              <span className="text-sm">
                {userProfile?.bio || "bio here....."}
              </span>
            </div>
          </section>
        </div>
        <div className="border-t border-t-gray-200">
          <div className="flex items-center justify-center gap-10 text-sm">
            <span
              onClick={() => handleTabchange("posts")}
              className={`py-3 cursor-pointer ${activeTab === "posts" ? "font-bold border-t border-black dark:border-white" : "text-gray-500"}`}
            >
              POSTS
            </span>
            <span
              onClick={() => handleTabchange("saved")}
              className={`py-3 cursor-pointer ${activeTab === "saved" ? "font-bold border-t border-black dark:border-white" : "text-gray-500"}`}
            >
              SAVED
            </span>
            <span
              onClick={() => handleTabchange("reels")}
              className={`py-3 cursor-pointer ${activeTab === "reels" ? "font-bold border-t border-black dark:border-white" : "text-gray-500"}`}
            >
              REELS
            </span>
            <span
              onClick={() => handleTabchange("tabs")}
              className={`py-3 cursor-pointer ${activeTab === "tabs" ? "font-bold border-t border-black dark:border-white" : "text-gray-500"}`}
            >
              TAGS
            </span>
          </div>

          {activeTab === "saved" && (
            <div className="flex items-center justify-center gap-6 mb-4 text-xs">
              <button
                onClick={() => setSavedTab("all")}
                className={`pb-1 px-2 ${savedTab === "all" ? "border-b-2 border-black font-bold" : "text-gray-500"}`}
              >
                All
              </button>
              <button
                onClick={() => setSavedTab("posts")}
                className={`pb-1 px-2 ${savedTab === "posts" ? "border-b-2 border-black font-bold" : "text-gray-500"}`}
              >
                Posts
              </button>
              <button
                onClick={() => setSavedTab("reels")}
                className={`pb-1 px-2 ${savedTab === "reels" ? "border-b-2 border-black font-bold" : "text-gray-500"}`}
              >
                Reels
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-3 px-1 md:px-0">
            {displayedPost?.map((post) => (
              <div
                key={post?._id}
                className="relative group cursor-pointer overflow-hidden rounded-md shadow-sm"
                onClick={() => handlePostClick(post)}
              >
                {post?.postType === "reel" ? (
                  <div className="relative w-full aspect-square bg-black">
                    <video
                      src={post?.video}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute top-2 right-2">
                      <svg
                        className="w-5 h-5 text-white drop-shadow-md"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <img
                    src={post?.image}
                    alt="postimage"
                    className="rounded-md w-full aspect-square object-cover transform transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center text-white space-x-6">
                    <Button className="flex items-center gap-2 bg-transparent hover:bg-transparent hover:text-gray-300 transition-colors shadow-none cursor-pointer">
                      <Heart className="w-5 h-5 cursor-pointer" />
                      <span>{post?.likes?.length}</span>
                    </Button>
                    <Button className="flex items-center gap-2 bg-transparent hover:bg-transparent hover:text-gray-300 transition-colors shadow-none cursor-pointer">
                      <MessageCircle className="w-5 h-5 cursor-pointer" />
                      <span>{post?.comments?.length}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CommentDialog open={open} setOpen={setOpen} />
    </section>
  );
};

export default Profile;
