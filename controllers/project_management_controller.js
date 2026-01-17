import { Project } from "../models/models.js";
import asyncHandler from "../utils/asyncHandler.js";


// const requests_for_project = asyncHandler(async (req, res) => {
//     const user = req.user;

//     if (!user) res.json({ message: "cannot get the user login again ", success: false });

//     const project_id = req.body?.project_id;

//     if (!project_id) res.json({ message: "cannot get the project id for requrst", success: false });

//     const project = await Project.findById({ id: project_id });

//     if (!project) res.json({ success: false, message: "cannot get the project with the user id" });

//     project.requests.push(user._id);

//     const res = await project.save()

//     if (!res) return res.json({ success: false, message: "cannot save document" })

//     res.status(200).json({ success: true, message: "request successful" });
// })


// const approve_request = asyncHandler(async (req, res) => {
//     const user = req?.user;
//     const user_id = req.body?.collaborator_id;
//     const project_id = req.body?.project_id;

//     if (!user) 
//         return res.json({ success: false, message: "cannot get user to approve request" });

//     if (!project_id || !user_id)
//         return res.json({ success: false, message: "project id or collaborator id missing" });

//     const project = await Project.findById(project_id);

//     if (!project)
//         return res.json({ success: false, message: "Project not found" });

//     let allowed = false;

//     if (user.globalRole === "super_admin") {
//         allowed = true;
//     } else {
//         const member = project.members.find(
//             m => String(m.userId) === String(user._id)
//         );
//         if (member && member.roles.includes("admin")) {
//             allowed = true;
//         }
//     }

//     if (!allowed)
//         return res.json({ success: false, message: "You do not have permission to approve requests" });

//     const requestIndex = project.requests.findIndex(
//         r => String(r) === String(user_id)
//     );

//     if (requestIndex === -1)
//         return res.json({ success: false, message: "This user has not requested to join" });

//     project.requests.splice(requestIndex, 1);

//     const isAlreadyMember = project.members.some(
//         m => String(m.userId) === String(user_id)
//     );

//     if (isAlreadyMember)
//         return res.json({ success: false, message: "User is already a member" });

//     project.members.push({
//         userId: user_id,
//         roles: ["collaborator"],
//         invitedAt: new Date(),
//         invitedBy: user._id
//     });

//     await project.save();

//     return res.json({
//         success: true,
//         message: "Request approved and user added as collaborator"
//     });
// });

// const cancel_request = asyncHandler(async (req, res) => {
//     const user = req?.user;

//     if (!user)
//         return res.json({ success: false, message: "cannot find user" });

//     const collaborator_id = req.body?.collaborator_id;
//     if (!collaborator_id)
//         return res.json({ success: false, message: "cannot get collaborator id to cancel request" });

//     const project_id = req.body?.project_id;
//     if (!project_id)
//         return res.json({ success: false, message: "cannot get project id for cancellation" });

//     const project = await Project.findById(project_id);
//     if (!project)
//         return res.json({ success: false, message: "Project not found" });

//     let allowed = false;

//     if (user.globalRole === "super_admin") {
//         allowed = true;
//     } else {
//         const member = project.members.find(
//             m => String(m.userId) === String(user._id)
//         );
//         if (member && member.roles.includes("admin")) {
//             allowed = true;
//         }
//     }

//     if (!allowed)
//         return res.json({ success: false, message: "You do not have permission to cancel requests" });
//     const requestIndex = project.requests.findIndex(
//         r => String(r) === String(collaborator_id)
//     );

//     if (requestIndex === -1)
//         return res.json({
//             success: false,
//             message: "This user has not requested to join"
//         });

//     project.requests.splice(requestIndex, 1);

//     await project.save();

//     return res.json({
//         success: true,
//         message: "Request canceled successfully"
//     });
// });



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