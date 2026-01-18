import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { getIO } from "../socket/socket.js";
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }
    const existedUser = await User.findOne({
      email,
    });
    if (existedUser) {
      return res
        .status(409)
        .json({ message: "Account already existed", success: false });
    }

    const newUser = await User.create({
      username,
      name: username,
      email,
      password,
    });

    return res
      .status(201)
      .json({ message: "User registerd successfully", success: true, newUser });
  } catch (error) {
    console.log("Error in register user", error);
    return res.status(500).json({
      message: "Internal server error in register user",
      success: false,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!password || !email) {
      return res.status(400).json({
        message: "All fields are required ",
        success: false,
      });
    }
    const existedUsers = await User.findOne({ email });

    if (!existedUsers) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isPasswordCorrect = await existedUsers.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = await existedUsers.generateAccessToken();

    const populatedPosts = await Promise.all(
      existedUsers.posts.map(async (postId) => {
        const post = await Post.findById(postId);
        if (post?.author?.equals(existedUsers._id)) {
          return post;
        } else {
          return null;
        }
      }),
    );

    existedUsers.posts = populatedPosts;
    await existedUsers.save();
    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ message: "Login successfully", success: true, existedUsers });
  } catch (error) {
    console.log("Error in login user", error);
    return res.status(500).json({
      message: "Internal server error in login user",
      success: false,
    });
  }
};

const logoutUser = async (_, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res
      .status(200)
      .json({ message: "Logout successfully", success: true });
  } catch (error) {
    console.log("error in logout ", error);
    return res.status(500).json({ message: "Logout failed", success: false });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .populate({
        path: "posts",
        options: { sort: { createdAt: -1 } },
        populate: [
          {
            path: "author",
            select: "username name profilePicture",
          },
          {
            path: "comments",
            sort: { createdAt: -1 },
            populate: {
              path: "author",
              select: "username name profilePicture",
            },
          },
        ],
      })
      .populate("bookmarks")
      .populate("favorites");
    return res.status(200).json({ user, success: true });
  } catch (error) {
    console.log("Error in login user", error);
    return res.status(500).json({
      message: "Internal server error in login user",
      success: false,
    });
  }
};

const editProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bio, gender, username, name } = req.body;
    const profilePhoto = req.file?.path || null;
    let profilePhotoLocalPath;
    if (profilePhoto) {
      profilePhotoLocalPath = await uploadOnCloudinary(profilePhoto);
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (username && username !== user.username) {
      const existedUser = await User.findOne({ username });
      if (existedUser) {
        return res
          .status(409)
          .json({ message: "Username already taken", success: false });
      }
      user.username = username;
    }

    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (name) user.name = name;
    if (profilePhoto) {
      if (user.profilePicture) {
        const publicId = user.profilePicture.split("/").pop().split(".")[0];
        await deleteFromCloudinary(publicId);
      }
      user.profilePicture = profilePhotoLocalPath.secure_url;
    }

    await user.save();

    return res
      .status(200)
      .json({ message: "Profile updated ", success: true, user });
  } catch (error) {
    console.log("Error in edit profile", error);
    return res.status(500).json({
      message: "Internal server error in edit profile",
      success: false,
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const query = req.query.query || "";
    if (!query) {
      return res.status(200).json({ users: [], success: true });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    }).select("-password");

    return res.status(200).json({ users, success: true });
  } catch (error) {
    console.log("Error in searchUser", error);
    return res.status(500).json({
      message: "Internal server error in searchUser",
      success: false,
    });
  }
};

const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const suggestedUsers = await User.find({ _id: { $ne: userId } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    if (!suggestedUsers) {
      return res
        .status(400)
        .json({ message: "Currently don't have any user", success: false });
    }
    return res.status(200).json({ success: true, users: suggestedUsers });
  } catch (error) {
    console.log("Error in suggestedUsers ", error);
    return res.status(500).json({
      message: "Internal server error in suggestedUsers",
      success: false,
    });
  }
};

const followOrUnfollow = async (req, res) => {
  try {
    const followKarneWala = req.user._id;
    const jiskoFollowKaronga = req.params.id;

    if (followKarneWala.toString() === jiskoFollowKaronga) {
      return res.status(400).json({
        message: "You can't follow or unfollow yourself",
        success: false,
      });
    }
    const user = await User.findById(followKarneWala);
    const targetUser = await User.findById(jiskoFollowKaronga);

    if (!user || !targetUser) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const isFollowing = user.following.some(
      (id) => id.toString() === jiskoFollowKaronga.toString(),
    );

    if (isFollowing) {
      await Promise.all([
        User.updateOne(
          { _id: followKarneWala },
          { $pull: { following: jiskoFollowKaronga } },
        ),
        User.updateOne(
          { _id: jiskoFollowKaronga },
          { $pull: { followers: followKarneWala } },
        ),
      ]);

      // Fetch updated user data
      const updatedUser =
        await User.findById(followKarneWala).select("-password");

      return res.status(200).json({
        message: "Unfollowed successfully",
        success: true,
        user: updatedUser,
        action: "unfollow",
      });
    } else {
      await Promise.all([
        User.updateOne(
          { _id: followKarneWala },
          { $push: { following: jiskoFollowKaronga } },
        ),
        User.updateOne(
          { _id: jiskoFollowKaronga },
          { $push: { followers: followKarneWala } },
        ),
      ]);

      const updatedUser =
        await User.findById(followKarneWala).select("-password");

      try {
        const io = getIO();
        const follower = await User.findById(followKarneWala).select(
          "username profilePicture",
        );
        io.to(jiskoFollowKaronga.toString()).emit("newNotification", {
          senderId: followKarneWala.toString(),
          receiverId: jiskoFollowKaronga.toString(),
          type: "follow",
          message: `${follower.username} started following you`,
          sender: {
            _id: follower._id,
            username: follower.username,
            profilePicture: follower.profilePicture,
          },
          createdAt: new Date(),
        });
      } catch (socketError) {
        console.log("Socket.IO error in followOrUnfollow:", socketError);
      }

      return res.status(200).json({
        message: "followed successfully",
        success: true,
        user: updatedUser,
        action: "follow",
      });
    }
  } catch (error) {
    console.log("Error in followOrUnfollow ", error);
    return res.status(500).json({
      message: "Internal server error in followOrUnfollow",
      success: false,
    });
  }
};

const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).populate({
      path: "followers",
      select: "name username profilePicture bio",
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      followers: user.followers,
      success: true,
    });
  } catch (error) {
    console.log("Error in getFollowers", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).populate({
      path: "following",
      select: "name username profilePicture bio",
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      following: user.following,
      success: true,
    });
  } catch (error) {
    console.log("Error in getFollowing", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  editProfile,
  getSuggestedUsers,
  followOrUnfollow,
  searchUser,
  getFollowers,
  getFollowing,
};
