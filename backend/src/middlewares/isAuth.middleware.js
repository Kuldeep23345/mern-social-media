import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "User unauthorized" });
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return res.status(401).json({ message: "User unauthorized" });
    }

    const user = await User.findById(decode._id).select("_id");
    if (!user) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      return res
        .status(401)
        .json({ message: "User not found", success: false });
    }

    req.user = { _id: user._id };
    next();
  } catch (error) {
    console.log("Error in isAuth middleware", error);
    return res.status(500).json({
      message: "Internal server error in isAuth middleware",
      success: false,
    });
  }
};
