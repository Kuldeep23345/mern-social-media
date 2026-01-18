import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import instance from "@/lib/axios.instance";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "@/redux/authSlice";
import { toast } from "sonner";

const FollowersPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);

  const isFollowersPage = location.pathname.includes("/followers");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingInProgress, setFollowingInProgress] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const endpoint = isFollowersPage
          ? `/user/${id}/followers`
          : `/user/${id}/following`;
        const res = await instance.get(endpoint);
        if (res.data.success) {
          const fetchedUsers = isFollowersPage
            ? res.data.followers
            : res.data.following;
          setUsers(fetchedUsers);

          // Sync Redux if viewing own following list to ensure button states are correct
          if (!isFollowersPage && user && id === user?._id) {
            const followingIds = fetchedUsers.map((u) => u._id);
            dispatch(setAuthUser({ ...user, following: followingIds }));
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [id, isFollowersPage]);

  const handleFollow = async (targetUserId) => {
    setFollowingInProgress((prev) => ({ ...prev, [targetUserId]: true }));

    try {
      const res = await instance.post(`/user/followorunfollow/${targetUserId}`);
      if (res.data.success) {
        toast.success(res.data.message);

        // Update user's following list in Redux
        const updatedFollowing = isFollowing(targetUserId)
          ? user.following.filter(
              (id) => id.toString() !== targetUserId.toString(),
            )
          : [...user.following, targetUserId];

        dispatch(setAuthUser({ ...user, following: updatedFollowing }));

        // Refresh the list
        const endpoint = isFollowersPage
          ? `/user/${id}/followers`
          : `/user/${id}/following`;
        const listRes = await instance.get(endpoint);
        if (listRes.data.success) {
          setUsers(
            isFollowersPage ? listRes.data.followers : listRes.data.following,
          );
        }
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      toast.error("Failed to update follow status");
    } finally {
      setFollowingInProgress((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const isFollowing = (targetUserId) => {
    return user?.following?.some(
      (id) => id.toString() === targetUserId.toString(),
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isFollowersPage ? "Followers" : "Following"}
          </h1>
          <p className="text-sm text-gray-500">
            {users.length} {users.length === 1 ? "person" : "people"}
          </p>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0095F6] opacity-50" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            No {isFollowersPage ? "followers" : "following"} yet
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {isFollowersPage
              ? "When people follow this account, they'll appear here."
              : "When this account follows people, they'll appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((targetUser) => (
            <div
              key={targetUser._id}
              className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              <div
                className="flex items-center gap-4 flex-1 cursor-pointer"
                onClick={() => navigate(`/profile/${targetUser._id}`)}
              >
                <Avatar className="w-14 h-14 ring-2 ring-transparent group-hover:ring-[#0095F6]/20 transition-all">
                  <AvatarImage src={targetUser.profilePicture} />
                  <AvatarFallback>
                    {(targetUser.name || targetUser.username)
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold truncate">
                    {targetUser.name || targetUser.username}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    @{targetUser.username}
                  </p>
                  {targetUser.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                      {targetUser.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Follow Button */}
              {user?._id !== targetUser._id && (
                <Button
                  onClick={() => handleFollow(targetUser._id)}
                  disabled={followingInProgress[targetUser._id]}
                  className={`text-sm font-semibold px-6 ${
                    isFollowing(targetUser._id)
                      ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                      : "bg-[#0095F6] hover:bg-[#007ccf] text-white"
                  }`}
                >
                  {followingInProgress[targetUser._id] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing(targetUser._id) ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowersPage;
