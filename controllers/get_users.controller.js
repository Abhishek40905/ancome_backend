import asyncHandler from "../utils/asyncHandler.js";
import { User,Project } from "../models/models.js";

const getAllUsersDisplayNames = asyncHandler(async (req, res) => {
  const users = await User.find(
    {}, 
    {
      _id: 1, 
      displayName: 1, 
      username: 1,
      isEventManager: 1, 
      globalRole: 1
    }
  ).lean();

  return res.json({
    success: true,
    users
  });
});

const get_user_profile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch User Details
  const user = await User.findById(userId).select("-password"); // Exclude password
  
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // 2. Fetch Projects where user is a member
  // We look for the userId inside the 'members' array of the Project collection
  const projects = await Project.find({
    "members.userId": userId
  }).sort({ updatedAt: -1 }); // Show most recent active projects first

  return res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    data: {
      user,
      projects
    }
  });
});
export { getAllUsersDisplayNames,get_user_profile };
