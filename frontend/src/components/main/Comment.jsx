import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const Comment = ({ comment }) => {
  return (
    <div className="my-2">
      <div className="flex gap-3 items-center">
        <Avatar>
          <AvatarImage
            className={"object-cover"}
            src={comment?.author?.profilePicture}
          />
          <AvatarFallback>
            {(comment?.author?.name || comment?.author?.username)
              ?.charAt(0)
              ?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="font-bold text-sm">
          {comment?.author?.name || comment?.author?.username}
          <span className="font-normal pl-1">{comment?.text}</span>
        </h1>
      </div>
    </div>
  );
};

export default Comment;
