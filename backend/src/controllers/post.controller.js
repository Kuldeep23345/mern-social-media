import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { getIO } from "../socket/socket.js";
import sharp from "sharp";
const addNewPost = async (req, res) => {
  try {
    const authorId = req.user._id;
    const { caption } = req.body;
    const image = req.file || null;

    if (!image) {
      return res
        .status(400)
        .json({ message: "Image is required", success: false });
    }

    const cloudResponse = await uploadOnCloudinary(image.path);
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });

    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });

    return res
      .status(201)
      .json({ message: "New post added", success: true, post });
  } catch (error) {
    console.log("Error in add new post ", error);
    return res.status(500).json({
      message: "Internal server error in add new post",
      success: false,
    });
  }
};

const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username name profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username name profilePicture",
        },
      });

    // Filter out posts with deleted authors
    const validPosts = posts.filter(
      (post) => post.author !== null && post.author !== undefined,
    );

    return res.status(200).json({ posts: validPosts, success: true });
  } catch (error) {
    console.log("Error in get all post ", error);
    return res.status(500).json({
      message: "Internal server error in get all post",
      success: false,
    });
  }
};

const getUserPost = async (req, res) => {
  try {
    const authorId = req.user._id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username name profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username name profilePicture" },
      });

    // Filter out posts with deleted authors (shouldn't happen for user's own posts, but safety check)
    const validPosts = posts.filter(
      (post) => post.author !== null && post.author !== undefined,
    );

    return res.status(200).json({ posts: validPosts, success: true });
  } catch (error) {
    console.log("Error in get user post ", error);
    return res.status(500).json({
      message: "Internal server error in get user post",
      success: false,
    });
  }
};

const likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;
    const post = await Post.findById(postId).populate("author");
    if (!post) {
      return res
        .status(404)
        .json({ message: "post not found", success: false });
    }

    const wasAlreadyLiked = post.likes.includes(userId);
    await post.updateOne({ $addToSet: { likes: userId } });
    await post.save();

    // Send notification if post author is not the one liking
    if (!wasAlreadyLiked && post.author._id.toString() !== userId.toString()) {
      try {
        const io = getIO();
        const sender = await User.findById(userId).select(
          "username name profilePicture",
        );
        const payload = {
          senderId: userId.toString(),
          receiverId: post.author._id.toString(),
          type: "like",
          message: `${sender.username} liked your post`,
          postId: postId.toString(),
          sender: {
            _id: sender._id,
            username: sender.username,
            name: sender.name,
            profilePicture: sender.profilePicture,
          },
          createdAt: new Date(),
        };

        io.to(post.author._id.toString()).emit("newNotification", payload);

        // #endregion
      } catch (socketError) {
        console.log("Socket.IO error in likePost:", socketError);
      }
    }

    // Emit socket event for real-time update
    try {
      const io = getIO();
      io.emit("postUpdate", {
        postId: postId.toString(),
        likes: post.likes.includes(userId)
          ? post.likes
          : [...post.likes, userId],
        type: "like",
      });
    } catch (socketError) {
      console.log("Socket.IO error in likePost update:", socketError);
    }

    return res.status(200).json({ message: "Post liked ", success: true });
  } catch (error) {
    console.log("Error in like user ", error);
    return res.status(500).json({
      message: "Internal server error in like user",
      success: false,
    });
  }
};
const dislikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "post not found", success: false });
    }
    await post.updateOne({ $pull: { likes: userId } });
    await post.save();

    // Emit socket event for real-time update
    try {
      const io = getIO();
      io.emit("postUpdate", {
        postId: postId.toString(),
        likes: post.likes.filter((id) => id.toString() !== userId.toString()),
        type: "dislike",
      });
    } catch (socketError) {
      console.log("Socket.IO error in dislikePost update:", socketError);
    }

    return res.status(200).json({ message: "Post dislike ", success: true });
  } catch (error) {
    console.log("Error in dislike user ", error);
    return res.status(500).json({
      message: "Internal server error in dislike user",
      success: false,
    });
  }
};

const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { text } = req.body;
    if (!text) {
      return res
        .status(400)
        .json({ message: "text is required", success: false });
    }

    const post = await Post.findById(postId).populate("author");
    const comment = await Comment.create({
      text,
      author: userId,
      post: postId,
    });

    await comment.populate({
      path: "author",
      select: "username name profilePicture",
    });

    post.comments.push(comment._id);
    await post.save();

    // Send notification if post author is not the one commenting
    if (post.author._id.toString() !== userId.toString()) {
      try {
        const io = getIO();
        io.to(post.author._id.toString()).emit("newNotification", {
          senderId: userId.toString(),
          receiverId: post.author._id.toString(),
          type: "comment",
          message: `${comment.author.username} commented on your post`,
          postId: postId.toString(),
          sender: {
            _id: comment.author._id,
            username: comment.author.username,
            name: comment.author.name,
            profilePicture: comment.author.profilePicture,
          },
          createdAt: new Date(),
        });
      } catch (socketError) {
        console.log("Socket.IO error in addComment:", socketError);
      }
    }

    // Emit socket event for real-time update
    try {
      const io = getIO();
      // We need to fetch the post again to get all populated comments if we want to sync perfectly
      // Or just send the new comment and let frontend handle it.
      // But syncing the whole array is more robust if others are also adding comments.
      const updatedPost = await Post.findById(postId).populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username name profilePicture",
        },
      });

      io.emit("postUpdate", {
        postId: postId.toString(),
        comments: updatedPost.comments,
        type: "comment",
      });
    } catch (socketError) {
      console.log("Socket.IO error in addComment update:", socketError);
    }

    return res
      .status(201)
      .json({ message: "Comment Added", comment, success: true });
  } catch (error) {
    console.log("Error in add comment  ", error);
    return res.status(500).json({
      message: "Internal server error in add comment  ",
      success: false,
    });
  }
};
const getCommentOfPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId }).populate({
      path: "author",
      select: "username name profilePicture", // 👈 space-separated, not comma
    });

    if (!comments || comments.length === 0) {
      return res.status(404).json({
        message: "No comments found for this post",
        success: false,
      });
    }

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("Error in getCommentOfPost:", error);
    return res.status(500).json({
      message: "Internal server error in get comment of post",
      success: false,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    if (post.author.toString() !== authorId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await Post.findByIdAndDelete(postId);
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);

    await user.save();

    await Comment.deleteMany({ post: postId });

    return res.status(200).json({ message: "Post deleted", success: true });
  } catch (error) {
    console.log("Error in delete post ", error);
    return res.status(500).json({
      message: "Internal server error in delete post",
      success: false,
    });
  }
};

const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    const user = await User.findById(authorId);
    if (user.bookmarks.includes(post._id)) {
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        type: "unsaved",
        message: "Post removed from bookmark",
        success: true,
      });
    } else {
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        type: "saved",
        message: "Post  bookmarked",
        success: true,
      });
    }
  } catch (error) {
    console.log("Error in bookmarkpost ", error);
    return res.status(500).json({
      message: "Internal server error in bookmarkpost",
      success: false,
    });
  }
};

const favoritePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    const user = await User.findById(authorId);
    if (user.favorites.includes(post._id)) {
      await user.updateOne({ $pull: { favorites: post._id } });
      await user.save();
      return res.status(200).json({
        type: "unfavorited",
        message: "Post removed from favorites",
        success: true,
      });
    } else {
      await user.updateOne({ $addToSet: { favorites: post._id } });
      await user.save();
      return res.status(200).json({
        type: "favorited",
        message: "Post added to favorites",
        success: true,
      });
    }
  } catch (error) {
    console.log("Error in favoritePost ", error);
    return res.status(500).json({
      message: "Internal server error in favoritePost",
      success: false,
    });
  }
};

export {
  addNewPost,
  getAllPost,
  getUserPost,
  likePost,
  dislikePost,
  addComment,
  getCommentOfPost,
  deletePost,
  bookmarkPost,
  favoritePost,
};
