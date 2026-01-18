import express from "express";
import { isAuth } from "../middlewares/isAuth.middleware.js";
import { upload } from "../middlewares/mullter.middleware.js";
import {
  addComment,
  addNewPost,
  bookmarkPost,
  deletePost,
  dislikePost,
  favoritePost,
  getAllPost,
  getCommentOfPost,
  getUserPost,
  likePost,
  getReels,
} from "../controllers/post.controller.js";

const router = express.Router();

router.route("/addpost").post(isAuth, upload.single("file"), addNewPost);
router.route("/reels").get(isAuth, getReels);
router.route("/get").get(isAuth, getAllPost);
router.route("/userpost-all").get(isAuth, getUserPost);
router.route("/:id/like").get(isAuth, likePost);
router.route("/:id/dislike").get(isAuth, dislikePost);
router.route("/:id/comment").post(isAuth, addComment);
router.route("/:id/comment-all").get(isAuth, getCommentOfPost);
router.route("/delete/:id").delete(isAuth, deletePost);
router.route("/:id/bookmark").get(isAuth, bookmarkPost);
router.route("/:id/favorite").get(isAuth, favoritePost);

export default router;
