import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Bookmark, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { Button } from "../ui/button";
import CommentDialog from "./CommentDialog";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import instance from "@/lib/axios.instance";
import { setPosts, setSlectedPost } from "@/redux/postSlice";
import { setAuthUser } from "@/redux/authSlice";

const Post = ({ post }) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false)
  const [postLike, setPostLike] = useState(post?.likes?.length || 0)
  const [comment, setComment] = useState(post?.comments || [])
  const { user } = useSelector(store => store.auth)
  const { posts } = useSelector(store => store.posts)
  const dispatch = useDispatch()
  const [liked, setLiked] = useState(post?.likes?.includes(user?._id) || false)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Check if user is following the post author
  useEffect(() => {
    if (user && post?.author) {
      const following = user.following?.some(
        (id) => id?.toString() === post.author._id?.toString()
      ) || false
      setIsFollowingAuthor(following)
    }
  }, [user, post?.author])
  
  // Don't render if post or author is missing
  if (!post || !post.author) {
    return null;
  }
  const changeEventHandler = (e) => {
    const inputText = e.target.value;
    if (inputText.trim()) {
      setText(inputText);
    } else {
      setText("");
    }
  };

  const deletePostHandler = async () => {
    try {
      const res = await instance.delete(`/post/delete/${post?._id}`)
      if (res.data.success) {
        const updatedPostData = posts?.filter((postItem) => postItem?._id !== post?._id)
        dispatch(setPosts(updatedPostData))
        toast.success(res?.data?.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message)
    }

  }

  const likeOrDislikeHandler = async () => {
    try {
      const action = liked ? 'dislike' : 'like'
      const res = await instance.get(`/post/${post?._id}/${action}`)
      if (res.data.success) {
        const updatedLike = liked ? postLike - 1 : postLike + 1;
        setLiked(!liked)
        setPostLike(updatedLike)

        toast.success(res?.data?.message)

        const updatedPostData = posts.map(p => p._id === post._id ? { ...p, likes: liked ? p.likes.filter(id => id !== user._id) : [...p.likes, user._id] } : p);
        dispatch(setPosts(updatedPostData))

      }

    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message)
    }

  }

  const commentHandler = async () => {
    try {
      const res = await instance.post(`/post/${post._id}/comment`, { text })
      if (res.data.success) {
        toast.success(res?.data?.message)
        const updatedCommentData = [...comment, res?.data?.comment]
        setComment(updatedCommentData)

        const updatedPostData = posts.map(p => p._id === post._id ? { ...p, comments: updatedCommentData } : p)
        dispatch(setPosts(updatedPostData))
        setText("")
      }

    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message)
    }

  }

  const handleFollowUnfollow = async () => {
    if (!post?.author || !user || user._id === post.author._id || followLoading) return

    setFollowLoading(true)
    try {
      const res = await instance.post(`/user/followorunfollow/${post.author._id}`)
      if (res.data.success) {
        toast.success(res.data.message)
        
        // Update following status
        setIsFollowingAuthor(!isFollowingAuthor)
        
        // Update user's following list in Redux
        if (user.following) {
          const updatedFollowing = isFollowingAuthor
            ? user.following.filter(id => id?.toString() !== post.author._id?.toString())
            : [...user.following, post.author._id]
          
          dispatch(setAuthUser({ ...user, following: updatedFollowing }))
        }
      }
    } catch (error) {
      console.error('Error in follow/unfollow:', error)
      toast.error(error?.response?.data?.message || 'Failed to follow/unfollow')
    } finally {
      setFollowLoading(false)
    }
  }
  return (
    <div className="my-8 w-full max-w-sm md:max-w-lg mx-auto px-2 md:px-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage className={'object-cover'} src={post?.author?.profilePicture} />
            <AvatarFallback>
              {post?.author?.username?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="font-medium">{post?.author?.username}</h1>
        </div>
        <Dialog>
          <DialogTrigger>
            <MoreHorizontal className="cursor-pointer" />
          </DialogTrigger>
          <DialogContent className={"px-0 py-4 flex items-center flex-col"}>
            {user && user._id !== post?.author?._id && (
              <Button 
                variant={'ghost'} 
                className={`cursor-pointer w-fit font-bold ${isFollowingAuthor ? 'text-[#ED4956]' : ''}`}
                onClick={handleFollowUnfollow}
                disabled={followLoading}
              >
                {followLoading ? 'Loading...' : (isFollowingAuthor ? 'Unfollow' : 'Follow')}
              </Button>
            )}
            <Button variant={'ghost'} className={'cursor-pointer w-fit font-bold'}>Add to Favorites</Button>

            {
              user && user?._id === post?.author?._id && (
                <Button 
                  onClick={deletePostHandler} 
                  variant={'ghost'} 
                  className={'cursor-pointer w-fit font-bold text-[#ED4956]'}
                >
                  Delete
                </Button>
              )
            }

          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center justify-center w-full h-auto">
        <img
          src={post?.image}
          alt="post-img"
          className="w-full mt-2 h-[300px] md:h-[400px] object-cover rounded-lg"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center gap-3 my-2">
            {
              liked ? <FaHeart onClick={likeOrDislikeHandler} size={"22px"} className="cursor-pointer text-red-500" /> : <FaRegHeart onClick={likeOrDislikeHandler} size={"22px"} className="cursor-pointer" />
            }

            <MessageCircle onClick={() => { dispatch(setSlectedPost(post)); setOpen(true) }} className="cursor-pointer hover:text-gray-600" />
            <Send className="cursor-pointer hover:text-gray-600" />
          </div>
          <Bookmark className="cursor-pointer hover:text-gray-600" />
        </div>
      </div>
      <span className="font-medium block mb-2">{postLike} likes</span>
      <p>
        <span className="font-medium mr-2">{post?.author?.username}</span>
        {post?.caption}
      </p>

      {
        comment && comment.length > 0 && (
          <span className="cursor-pointer text-sm text-gray-400" onClick={() => { dispatch(setSlectedPost(post)); setOpen(true) }}>View all {comment.length} comments</span>
        )
      }

      <CommentDialog open={open} setOpen={setOpen} />
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Add a comment...."
          value={text}
          onChange={changeEventHandler}
          className="outline-none text-sm w-full"
        />
        {text && <span onClick={commentHandler} className="text-[#3BADF8] cursor-pointer">Post</span>}
      </div>
    </div>
  );
};

export default Post;
