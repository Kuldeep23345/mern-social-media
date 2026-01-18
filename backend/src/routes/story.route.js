import express from "express";
import { isAuth } from "../middlewares/isAuth.middleware.js";
import { upload } from "../middlewares/mullter.middleware.js";
import {
  addStory,
  getAllStories,
  deleteStory,
} from "../controllers/story.controller.js";

const router = express.Router();

router.route("/add").post(isAuth, upload.single("file"), addStory);
router.route("/all").get(isAuth, getAllStories);
router.route("/delete/:id").delete(isAuth, deleteStory);

export default router;
