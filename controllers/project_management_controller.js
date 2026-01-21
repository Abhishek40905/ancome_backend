import { Project } from "../models/models.js";
import asyncHandler from "../utils/asyncHandler.js";

const update_project_settings = asyncHandler(async (req, res) => {
  const { projectId, name, description, status, skillsRequired, github } = req.body;
  const userId = req.user._id;

  if (!projectId) {
    return res.status(400).json({ success: false, message: "Project ID is required" });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found" });
  }

  // 🔒 Security Check: Is the user an Admin of this project?
  // We check the 'members' array for the user's ID with the 'admin' role
  const isAdmin = project.members.some(
    (m) => m.userId.toString() === userId.toString() && m.roles.includes("admin")
  );

  if (!isAdmin) {
    return res.status(403).json({ success: false, message: "Access Denied: You are not an admin of this project." });
  }

  // ✅ Apply Updates
  if (name) project.name = name.trim();
  if (description) project.description = description.trim();
  if (status) project.status = status;
  
  if (skillsRequired) {
    project.skillsRequired = Array.isArray(skillsRequired) 
      ? skillsRequired 
      : skillsRequired.split(",").map(s => s.trim()).filter(s => s);
  }

  // Handle GitHub updates only if it's a code project
  if (project.type === 'code' && github) {
     project.github = {
        ...project.github,
        repoUrl: github.repoUrl || project.github?.repoUrl
     };
  }

  await project.save();

  return res.status(200).json({
    success: true,
    message: "Project settings updated successfully",
    project // Return updated project to refresh frontend
  });
});


const approve_join_request = asyncHandler(async (req, res) => {
  const { projectId, userIdToApprove } = req.body;
  const currentAdminId = req.user._id;

  if (!projectId || !userIdToApprove) {
    return res.status(400).json({ success: false, message: "Project ID and User ID are required" });
  }

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  // 🔒 Security: Check if current user is Admin
  const isAdmin = project.members.some(
    m => m.userId.toString() === currentAdminId.toString() && m.roles.includes("admin")
  );
  if (!isAdmin) return res.status(403).json({ success: false, message: "Access Denied" });

  // ✅ Logic: Remove from requests -> Add to members
  // 1. Remove from requests array
  project.requests = project.requests.filter(id => id.toString() !== userIdToApprove.toString());

  // 2. Add to members (Check if already there to be safe)
  const isAlreadyMember = project.members.some(m => m.userId.toString() === userIdToApprove.toString());
  
  if (!isAlreadyMember) {
    project.members.push({
      userId: userIdToApprove,
      roles: ["collaborator"], // Default role
      invitedAt: Date.now(),
      invitedBy: currentAdminId
    });
  }

  await project.save();

  return res.status(200).json({ success: true, message: "User approved successfully", project });
});

// 2. REJECT REQUEST
const reject_join_request = asyncHandler(async (req, res) => {
  const { projectId, userIdToReject } = req.body;
  const currentAdminId = req.user._id;

  if (!projectId || !userIdToReject) {
    return res.status(400).json({ success: false, message: "Data missing" });
  }

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  // 🔒 Security: Check Admin
  const isAdmin = project.members.some(
    m => m.userId.toString() === currentAdminId.toString() && m.roles.includes("admin")
  );
  if (!isAdmin) return res.status(403).json({ success: false, message: "Access Denied" });

  // ✅ Logic: Just remove from requests
  project.requests = project.requests.filter(id => id.toString() !== userIdToReject.toString());

  await project.save();

  return res.status(200).json({ success: true, message: "Request rejected", project });
});


const remove_collaborator = asyncHandler(async (req, res) => {
  const { projectId, userIdToRemove } = req.body;
  const currentAdminId = req.user._id;

  if (!projectId || !userIdToRemove) {
    return res.status(400).json({ success: false, message: "Project ID and User ID are required" });
  }

  // 1. Find Project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found" });
  }

  // 2. Security Check: Is the requester an Admin?
  const isAdmin = project.members.some(
    (m) => m.userId.toString() === currentAdminId.toString() && m.roles.includes("admin")
  );

  if (!isAdmin) {
    return res.status(403).json({ success: false, message: "Access Denied: You are not an admin." });
  }

  // 3. Safety Check: Prevent Admin from removing themselves
  if (userIdToRemove.toString() === currentAdminId.toString()) {
    return res.status(400).json({ success: false, message: "You cannot remove yourself from the project." });
  }

  // 4. Remove the user from members array
  const initialCount = project.members.length;
  project.members = project.members.filter(
    (member) => member.userId.toString() !== userIdToRemove.toString()
  );

  // Check if anyone was actually removed
  if (project.members.length === initialCount) {
    return res.status(404).json({ success: false, message: "User is not a member of this project" });
  }

  await project.save();

  return res.status(200).json({
    success: true,
    message: "Collaborator removed successfully",
    project // Return updated project data
  });
});
export {update_project_settings,approve_join_request,reject_join_request,remove_collaborator}