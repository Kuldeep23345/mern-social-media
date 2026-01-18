import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { X, MoreHorizontal, Trash2, Loader2 } from "lucide-react";

import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import Comment from "./Comment";
import { toast } from "sonner";
import instance from "@/lib/axios.instance";
import { setPosts, setSlectedPost } from "@/redux/postSlice";
import { setAuthUser, setUserProfile } from "@/redux/authSlice";

const CommentDialog = ({ open, setOpen }) => {
  const [text, setText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [postDeleted, setPostDeleted] = useState(false);
  const { selectedPost, posts } = useSelector((store) => store.posts);
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (postDeleted) {
      window.location.reload();
    }
  }, [postDeleted]);

  const comments = selectedPost?.comments || [];

  const changeEventHandler = (e) => {
    const inputText = e.target.value;
    if (inputText.trim()) {
      setText(inputText);
    } else {
      setText("");
    }
  };

  const sendMessageHandler = async () => {
    try {
      const res = await instance.post(`/post/${selectedPost._id}/comment`, {
        text,
      });
      if (res.data.success) {
        toast.success(res?.data?.message);

        const updatedPostData = posts.map((p) =>
          p._id === selectedPost._id
            ? { ...p, comments: [...(p.comments || []), res.data.comment] }
            : p,
        );
        dispatch(setPosts(updatedPostData));

        dispatch(
          setSlectedPost({
            ...selectedPost,
            comments: [...(selectedPost.comments || []), res.data.comment],
          }),
        );

        setText("");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  const deletePostHandler = async () => {
    let deleteSuccessful = false;
    try {
      setDeleteLoading(true);
      const res = await instance.delete(`/post/delete/${selectedPost?._id}`);
      if (res.data.success) {
        deleteSuccessful = true;
        toast.success(res.data.message);

        try {
          const currentPosts = Array.isArray(posts) ? posts : [];
          const updatedPosts = currentPosts.filter(
            (postItem) => postItem?._id !== selectedPost?._id,
          );
          dispatch(setPosts(updatedPosts));

          if (userProfile?._id === user?._id) {
            const currentProfilePosts = Array.isArray(userProfile?.posts)
              ? userProfile.posts
              : [];
            const updatedUserProfile = {
              ...userProfile,
              posts: currentProfilePosts.filter(
                (p) => p?._id !== selectedPost?._id,
              ),
            };
            dispatch(setUserProfile(updatedUserProfile));
          }
        } catch (stateError) {
          console.error("State update error:", stateError);
        }

        setOpen(false);
        setPostDeleted(true);
      }
    } catch (error) {
      if (deleteSuccessful) {
        console.error("Post-delete cleanup error:", error);
        return;
      }
      console.error("Delete post error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <section>
      <Dialog open={open}>
        <DialogContent
          onInteractOutside={() => setOpen(false)}
          className={
            "max-w-5xl w-full flex flex-col p-0 outline-0 overflow-hidden"
          }
        >
          <div className="flex flex-1">
            <div className="w-1/2 flex items-center justify-center bg-black">
              {selectedPost?.postType === "reel" ? (
                <video
                  src={selectedPost?.video}
                  className="h-full w-full object-contain"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <img
                  src={selectedPost?.image}
                  alt="post-img"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="w-1/2 flex flex-col justify-between">
              <div className="flex items-center justify-between p-4">
                <div className="flex gap-3 items-center">
                  <Link>
                    <Avatar>
                      <AvatarImage
                        className={"object-cover"}
                        src={selectedPost?.author?.profilePicture}
                      />
                      <AvatarFallback>
                        {(
                          selectedPost?.author?.name ||
                          selectedPost?.author?.username
                        )
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link className="font-semibold text-xs">
                      {selectedPost?.author?.name ||
                        selectedPost?.author?.username}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user?._id === selectedPost?.author?._id?.toString() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer hover:bg-red-50 hover:text-red-500 rounded-full h-8 w-8 transition-colors"
                      onClick={deletePostHandler}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer hover:bg-gray-100 rounded-full h-8 w-8"
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <hr />
              <div className="flex-1 flex-col overflow-y-auto max-h-auto p-4">
                {comments?.map((comment) => (
                  <Comment key={comment._id} comment={comment} />
                ))}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment.."
                    value={text}
                    onChange={changeEventHandler}
                    className="w-full outline-none border-gray-300 p-2 rounded-2xl"
                  />
                  <Button
                    className={"cursor-pointer"}
                    disabled={!text.trim()}
                    onClick={sendMessageHandler}
                    variant={"outline"}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CommentDialog;
