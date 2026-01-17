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

const Profile = () => {
  const params = useParams();
  const userId = params.id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useGetUserProfile(userId);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { userProfile, user } = useSelector((store) => store.auth);
  const isLoggedInUserProfile = user?._id === userProfile?._id;

  // Check if user is following this profile
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

        // Update following status
        setIsFollowing(!isFollowing);

        // Update user's following list in Redux
        if (user.following) {
          const updatedFollowing = isFollowing
            ? user.following.filter(
                (id) => id?.toString() !== userProfile._id?.toString(),
              )
            : [...user.following, userProfile._id];

          dispatch(setAuthUser({ ...user, following: updatedFollowing }));
        }

        // Update userProfile's followers count
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
    // You can also dispatch setSelectedUser here if needed
  };

  const handleTabchange = (tab) => {
    setActiveTab(tab);
  };

  const displayedPost =
    (activeTab === "posts" ? userProfile?.posts : userProfile?.bookmarks) || [];
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
              <p>
                <span className="font-semibold">
                  {userProfile?.followers?.length}
                </span>{" "}
                followers
              </p>
              <p>
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
              className={`py-3 cursor-pointer${activeTab == "posts" ? "font-bold text-blue-500" : ""}`}
            >
              POSTS{" "}
            </span>
            <span
              onClick={() => handleTabchange("saved")}
              className={`py-3 cursor-pointer${activeTab == "saved" ? "font-bold text-blue-500" : ""}`}
            >
              SAVED{" "}
            </span>
            <span
              onClick={() => handleTabchange("reels")}
              className={`py-3 cursor-pointer${activeTab == "reels" ? "font-bold text-blue-500" : ""}`}
            >
              REELS{" "}
            </span>
            <span
              onClick={() => handleTabchange("tabs")}
              className={`py-3 cursor-pointer${activeTab == "tabs" ? "font-bold text-blue-500" : ""}`}
            >
              TAGS{" "}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-3 px-1 md:px-0">
            {displayedPost?.map((post) => (
              <div
                key={post?._id}
                className="relative group cursor-pointer overflow-hidden rounded-md shadow-sm"
              >
                <img
                  src={post?.image}
                  alt="postimage"
                  className="rounded-md w-full aspect-square object-cover transform transition-transform duration-500 group-hover:scale-105"
                />
                {/* Overlay */}
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
    </section>
  );
};

export default Profile;
