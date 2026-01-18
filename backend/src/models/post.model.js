import mongoose from "mongoose";
const postSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: function () {
        return this.postType === "post";
      },
    },
    video: {
      type: String,
      required: function () {
        return this.postType === "reel";
      },
    },
    postType: {
      type: String,
      enum: ["post", "reel"],
      default: "post",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true },
);

export const Post = mongoose.model("Post", postSchema);
