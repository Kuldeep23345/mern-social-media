import React from "react";
import Post from "./Post";
import { useSelector } from "react-redux";

const Posts = () => {
  const { posts } = useSelector((store) => store.posts);
  // Filter out posts with missing authors (deleted users) and only show regular posts
  const validPosts =
    posts?.filter((post) => post && post.author && post.postType === "post") ||
    [];

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {validPosts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
    </div>
  );
};

export default Posts;
