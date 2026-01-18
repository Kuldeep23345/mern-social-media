import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Story } from "../models/story.model.js";
import { User } from "../models/user.model.js";

const addStory = async (req, res) => {
  try {
    const authorId = req.user._id;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ message: "File is required", success: false });
    }

    const cloudResponse = await uploadOnCloudinary(file.path);
    if (!cloudResponse) {
      return res.status(500).json({ message: "Upload failed", success: false });
    }

    const isVideo = file.mimetype.startsWith("video");
    const storyData = {
      author: authorId,
    };

    if (isVideo) {
      storyData.video = cloudResponse.secure_url;
    } else {
      storyData.image = cloudResponse.secure_url;
    }

    const story = await Story.create(storyData);
    await story.populate({ path: "author", select: "username profilePicture" });

    return res.status(201).json({
      message: "Story added successfully",
      success: true,
      story,
    });
  } catch (error) {
    console.log("Error in add story:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

const getAllStories = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("following");

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const followingUsers = user.following;
    const stories = await Story.find({
      author: { $in: [...followingUsers, userId] },
    })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture" });

    // Group stories by user for the tray
    const groupedStories = stories.reduce((acc, story) => {
      const authorId = story.author._id.toString();
      if (!acc[authorId]) {
        acc[authorId] = {
          author: story.author,
          stories: [],
        };
      }
      acc[authorId].stories.push(story);
      return acc;
    }, {});

    return res
      .status(200)
      .json({ stories: Object.values(groupedStories), success: true });
  } catch (error) {
    console.log("Error in get all stories:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

const deleteStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const authorId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res
        .status(404)
        .json({ message: "Story not found", success: false });
    }

    if (story.author.toString() !== authorId.toString()) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    await Story.findByIdAndDelete(storyId);
    return res.status(200).json({ message: "Story deleted", success: true });
  } catch (error) {
    console.log("Error in delete story:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

export { addStory, getAllStories, deleteStory };
