import express from "express";
import {
  editProfile,
  followOrUnfollow,
  getProfile,
  getSuggestedUsers,
  loginUser,
  logoutUser,
  registerUser,
  searchUser,
  getFollowers,
  getFollowing,
} from "../controllers/user.controller.js";
import { isAuth } from "../middlewares/isAuth.middleware.js";
import { upload } from "../middlewares/mullter.middleware.js";

const router = express.Router();

// Public routes (no auth required)
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);

// Protected routes (auth required)
router
  .route("/profile-edit")
  .post(isAuth, upload.single("profilePhoto"), editProfile);
router.route("/suggested-user").get(isAuth, getSuggestedUsers);
router.route("/search").get(isAuth, searchUser);
router.route("/:id/profile").get(isAuth, getProfile);
router.route("/:id/followers").get(isAuth, getFollowers);
router.route("/:id/following").get(isAuth, getFollowing);
router.route("/followorunfollow/:id").post(isAuth, followOrUnfollow);

export default router;
