import jwt from "jsonwebtoken";
import { User } from "../models/models.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized request" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id).select("-password");
    
    if (!req.user) {
      return res.status(401).json({ message: "Invalid Access Token" });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Access Token" });
  }
});