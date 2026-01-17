import { Project } from "../models/models.js";
import asyncHandler from "../utils/asyncHandler.js";

// ... existing controllers ...

// 1. ADD MAIN COMMENT
const add_comment = asyncHandler(async (req, res) => {
  const { projectId, message } = req.body;
  const userId = req.user._id;

  if (!projectId || !message) {
    return res.status(400).json({ success: false, message: "Project ID and message are required" });
  }

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  // Create comment object based on your schema
  const newComment = {
    userId,
    message: message.trim(),
    createdAt: new Date(),
    replies: []
  };

  project.comments.push(newComment);
  await project.save();

  return res.status(200).json({ 
    success: true, 
    message: "Comment added successfully", 
    project 
  });
});

// 2. REPLY TO COMMENT
const reply_to_comment = asyncHandler(async (req, res) => {
  const { projectId, commentId, message } = req.body;
  const userId = req.user._id;

  if (!projectId || !commentId || !message) {
    return res.status(400).json({ success: false, message: "Data missing" });
  }

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  // Find the specific comment subdocument
  const comment = project.comments.id(commentId);
  
  if (!comment) {
    return res.status(404).json({ success: false, message: "Parent comment not found" });
  }

  // Add reply to that comment's replies array
  comment.replies.push({
    userId,
    message: message.trim(),
    createdAt: new Date()
  });

  await project.save();

  return res.status(200).json({ 
    success: true, 
    message: "Reply added successfully", 
    project 
  });
});

const get_project_comments = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ success: false, message: "Project ID is required" });
  }

  // Find project and select only the comments field
  // We explicitly sort them if needed, or just return as is
  const project = await Project.findById(projectId).select("comments");

  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found" });
  }

  return res.status(200).json({
    success: true,
    message: "Comments fetched successfully",
    comments: project.comments
  });
});
export { 
  add_comment, 
  reply_to_comment ,
  get_project_comments
};