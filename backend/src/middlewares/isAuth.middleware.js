import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication token required",
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    if (!decode) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    const user = await User.findById(decode._id).select("_id");

    if (!user) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }

    req.user = { _id: user._id };
    next();
  } catch (error) {
    console.log("Error in isAuth middleware", error);

    // Handle token expiration
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired. Please login again",
        success: false,
      });
    }

    // Handle invalid token
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    return res.status(500).json({
      message: "Internal server error in authentication",
      success: false,
    });
  }
};
