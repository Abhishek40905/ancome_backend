import { Project } from "../models/models.js";
import asyncHandler from "../utils/asyncHandler.js";

const request_join_project = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  const userId = req.user._id; // derived from your auth middleware

  if (!projectId) {
    return res.status(400).json({ success: false, message: "Project ID is required" });
  }

  // 1. Find the project
  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found" });
  }

  // 2. Check if user is ALREADY a member
  // We check the 'members' array to see if userId exists there
  const isAlreadyMember = project.members.some(
    (member) => member.userId.toString() === userId.toString()
  );

  if (isAlreadyMember) {
    return res.status(400).json({ success: false, message: "You are already a member of this project" });
  }

  // 3. Check if user has ALREADY requested
  // We check the 'requests' array
  const hasAlreadyRequested = project.requests.some(
    (reqId) => reqId.toString() === userId.toString()
  );

  if (hasAlreadyRequested) {
    return res.status(400).json({ success: false, message: "Request already pending" });
  }

  // 4. Add User ID to requests array
  project.requests.push(userId);
  await project.save();

  return res.status(200).json({
    success: true,
    message: "Join request sent successfully",
    requests: project.requests // Return updated list if needed
  });
});

export { request_join_project };