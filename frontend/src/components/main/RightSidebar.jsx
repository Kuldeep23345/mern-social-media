import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SuggestedUsers from "./SuggestedUsers";

const RightSidebar = () => {
  const {user} = useSelector(store=>store.auth)

  return <section className="w-full max-w-sm my-10">

      <div className="flex items-center gap-2 mb-4">
        <Link to={`/profile/${user?._id}`}>
          <Avatar>
            <AvatarImage className={'object-cover'} src={user?.profilePicture} />
            <AvatarFallback>
              {user?.username?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="font-semibold text-sm truncate"> 
              <Link to={`/profile/${user?._id}`}>{user?.username}</Link> 
            </h1>
            <span className="text-gray-600 text-xs truncate">{user?.bio || 'bio here....'}</span>
          </div>
        </div>
        <SuggestedUsers/>
  </section>;
};

export default RightSidebar;
