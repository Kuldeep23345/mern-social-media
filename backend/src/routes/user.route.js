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
} from "../controllers/user.controller.js";
import { isAuth } from "../middlewares/isAuth.middleware.js";
import { upload } from "../middlewares/mullter.middleware.js";

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/:id/profile").get(isAuth, getProfile);
router
  .route("/profile-edit")
  .post(isAuth, upload.single("profilePhoto"), editProfile);
router.route("/suggested-user").get(isAuth, getSuggestedUsers);
router.route("/followorunfollow/:id").post(isAuth, followOrUnfollow);
router.route("/search").get(isAuth, searchUser);

export default router;
